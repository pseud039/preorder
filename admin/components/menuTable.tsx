"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface Restaurant {
  id: number;
  name: string;
  imageUrl: string;
}

interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  restaurant: Restaurant;
}

interface MenuResponse {
  statusCode: number;
  data: {
    items: MenuItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message: string;
  success: boolean;
  redirectTo: null | string;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    restaurantId: "",
    isVeg: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/menu`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data: MenuResponse = await response.json();
      if (data.success) {
        setMenuItems(data.data.items);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
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
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("restaurantId", formData.restaurantId);
      formDataToSend.append("isVeg", String(formData.isVeg));
      
      if (imageFile) {
        formDataToSend.append("imageUrl", imageFile);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/menu`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: "",
          description: "",
          price: "",
          category: "",
          restaurantId: "",
          isVeg: true,
        });
        setImageFile(null);
        setIsDialogOpen(false);
        
        fetchMenuItems();
      } else {
        alert(data.message || "Failed to add menu item");
      }
    } catch (error) {
      console.error("Error adding menu item:", error);
      alert("Error adding menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 w-full p-6 bg-gray-50">
      <div className="flex justify-end items-center flex-row w-full">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> Add new item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="text-center">Add New Menu Item</DialogTitle>
              
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Margherita Pizza"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Brief description of the item"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="1.00"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="299"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="restaurantId">Restaurant ID </Label>
                    <Input
                      id="restaurantId"
                      type="number"
                      value={formData.restaurantId}
                      onChange={(e) => handleInputChange("restaurantId", e.target.value)}
                      placeholder="3"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    placeholder="e.g., Pizza, Dessert, Beverage"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                  />
                  {imageFile && (
                    <p className="text-sm text-gray-500">
                      Selected: {imageFile.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isVeg">Vegetarian</Label>
                  <Switch
                    id="isVeg"
                    checked={formData.isVeg}
                    onCheckedChange={(checked) => handleInputChange("isVeg", checked)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Table>
        <TableCaption>A list of your active menu items.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : menuItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No menu items found
              </TableCell>
            </TableRow>
          ) : (
            menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                <TableCell className="capitalize">{item.category}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </TableCell>
                <TableCell className="text-right">₹{item.price}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}