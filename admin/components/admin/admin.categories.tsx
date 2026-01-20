"use client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Category {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  _count: {
    menuItems: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    displayOrder: "0",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    displayOrder: "0",
    isActive: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/categories`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("displayOrder", formData.displayOrder);

      if (imageFile) {
        formDataToSend.append("imageUrl", imageFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/categories`,
        {
          method: "POST",
          credentials: "include",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Category created successfully!");
        setFormData({
          name: "",
          description: "",
          displayOrder: "0",
        });
        setImageFile(null);
        setImagePreview(null);
        setIsDialogOpen(false);
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Error creating category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (categoryId: number, currentStatus: boolean) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("isActive", String(!currentStatus));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/categories/${categoryId}`,
        {
          method: "PATCH",
          credentials: "include",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Category status updated successfully!");
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to update category status");
      }
    } catch (error) {
      console.error("Error updating category status:", error);
      toast.error("Error updating category status");
    }
  };

  const deleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category? Menu items in this category will be uncategorized.")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/categories/${categoryId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Category deleted successfully!");
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error deleting category");
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditFormData({
      name: category.name,
      description: category.description || "",
      displayOrder: String(category.displayOrder),
      isActive: category.isActive,
    });
    setEditImageFile(null);
    setEditImagePreview(category.imageUrl);
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (field: string, value: string | boolean) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", editFormData.name);
      formDataToSend.append("description", editFormData.description);
      formDataToSend.append("displayOrder", editFormData.displayOrder);
      formDataToSend.append("isActive", String(editFormData.isActive));

      if (editImageFile) {
        formDataToSend.append("imageUrl", editImageFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/categories/${editingCategory.id}`,
        {
          method: "PATCH",
          credentials: "include",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Category updated successfully!");
        setIsEditDialogOpen(false);
        setEditingCategory(null);
        setEditImageFile(null);
        setEditImagePreview(null);
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Error updating category");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="border rounded-lg overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 border-b animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage your menu categories
          </p>
        </div>

        {/* Add Category Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Appetizers, Main Course"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Brief description of this category"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => handleInputChange("displayOrder", e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">Lower numbers appear first</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="image">Category Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Order</TableHead>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Menu Items</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No categories found. Create your first category to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-500">
                      <GripVertical className="h-4 w-4" />
                      {category.displayOrder}
                    </div>
                  </TableCell>
                  <TableCell>
                    {category.imageUrl ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-gray-500">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {category._count.menuItems} items
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={category.isActive}
                      onCheckedChange={() => toggleActive(category.id, category.isActive)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCategory(category.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Category Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => handleEditInputChange("name", e.target.value)}
                  placeholder="e.g., Appetizers, Main Course"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => handleEditInputChange("description", e.target.value)}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-displayOrder">Display Order</Label>
                <Input
                  id="edit-displayOrder"
                  type="number"
                  min="0"
                  value={editFormData.displayOrder}
                  onChange={(e) => handleEditInputChange("displayOrder", e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500">Lower numbers appear first</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-image">Category Image</Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                />
                {editImagePreview && (
                  <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border">
                    <Image
                      src={editImagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isActive"
                  checked={editFormData.isActive}
                  onCheckedChange={(checked) => handleEditInputChange("isActive", checked)}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
