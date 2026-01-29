// "use client";
// import { useEffect, useState } from "react";
// import { DollarSign, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// interface Commission {
//   id: number;
//   restaurantId: number;
//   orderId: number;
//   orderAmount: string;
//   commissionRate: string;
//   commissionAmount: string;
//   restaurantAmount: string;
//   status: "pending" | "settled" | "failed";
//   createdAt: string;
//   restaurant: {
//     id: number;
//     name: string;
//   };
// }

// interface CommissionSummary {
//   summary: {
//     total: { amount: number; count: number };
//     pending: { amount: number; count: number };
//     settled: { amount: number; count: number };
//     failed: { amount: number; count: number };
//   };
// }

// interface CommissionsResponse {
//   statusCode: number;
//   data: {
//     commissions: Commission[];
//     pagination: {
//       total: number;
//       page: number;
//       limit: number;
//       totalPages: number;
//     };
//   };
//   message: string;
//   success: boolean;
// }
// interface PaymentSetup{
//   restrauntId:number;
//   fixedFee:number;
//   percentageFee:number;
//   minFee:number;
//   maxFee:number;
// }
// export default function CommissionsPage() {
//   const [commissions, setCommissions] = useState<Commission[]>([]);
//   const [summary, setSummary] = useState<CommissionSummary["summary"] | null>(
//     null
//   );
//   const [loading, setLoading] = useState<boolean>(true);
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   const [settlingId, setSettlingId] = useState<number | null>(null);
//   const [settlingAll, setSettlingAll] = useState<boolean>(false);
//   const [payment, setPayment] = useState<boolean>(false);
//   const [paymentDetails, setPaymentDetails] = useState<PaymentSetup | null>(null);
//   useEffect(() => {
//     fetchCommissions();
//     fetchSummary();
//   }, [statusFilter]);

//   const fetchCommissions = async () => {
//     try {
//       setLoading(true);
//       const url = new URL(
//         `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions`
//       );

//       if (statusFilter !== "all") {
//         url.searchParams.append("status", statusFilter);
//       }

//       const response = await fetch(url.toString(), {
//         method: "GET",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//       });

//       if (response.status === 401) {
//         toast.error("Session expired. Please login again.");
//         window.location.href = "/login";
//         return;
//       }

//       const data: CommissionsResponse = await response.json();

//       if (data.success) {
//         setCommissions(data.data.commissions);
//       } else {
//         toast.error("Failed to fetch commissions");
//       }
//     } catch (error) {
//       console.error("Error fetching commissions:", error);
//       toast.error("Error loading commissions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchSummary = async () => {
//     try {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions/summary`,
//         {
//           method: "GET",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//         }
//       );

//       const data = await response.json();

//       if (data.success) {
//         setSummary(data.data.summary);
//       }
//     } catch (error) {
//       console.error("Error fetching summary:", error);
//     }
//   };
//   const settlePayment = async()=>{
//     try{
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions`,
//         {
//           method: "GET",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//         }
//       );
//       const data = await response.json();

//       if (data.success) {
//         setPayment(true); 
//       }
//     }catch(error){
//       console.error("Error fetching commissions:", error);
//       toast.error("Error loading commissions");
//     }
//   }
//   const updatePayment = async()=>{
//     try{
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body:JSON.stringify(paymentDetails)
//         }
//       );
//       const data = await response.json();
//       if (data.success) {
//         toast.success("Payment setup updated successfully");
//         setPayment(false); 
//       }
//     }catch(error){
//       console.error("Error updating payment setup:", error);
//       toast.error("Error updating payment setup");
//     }
//   }

//   const settleCommission = async (commissionId: number) => {
//     try {
//       setSettlingId(commissionId);

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions/${commissionId}/status`,
//         {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({ status: "settled" }),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to settle commission");
//       }

//       toast.success("Commission settled successfully");
//       fetchCommissions();
//       fetchSummary();
//     } catch (error: any) {
//       console.error("Error settling commission:", error);
//       toast.error(error.message || "Failed to settle commission");
//     } finally {
//       setSettlingId(null);
//     }
//   };

//   const settleAllPending = async () => {
//     if (!confirm("Settle all pending commissions?")) return;

//     try {
//       setSettlingAll(true);

//       // Get all pending commission IDs
//       const pendingCommissions = commissions.filter(c => c.status === "pending");
      
//       if (pendingCommissions.length === 0) {
//         toast.error("No pending commissions to settle");
//         return;
//       }

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions/settle`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({ 
//             commissionIds: pendingCommissions.map(c => c.id)
//           }),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to settle commissions");
//       }

//       toast.success(`${data.data.settledCount} commission(s) settled`);
//       fetchCommissions();
//       fetchSummary();
//     } catch (error: any) {
//       console.error("Error settling commissions:", error);
//       toast.error(error.message || "Failed to settle commissions");
//     } finally {
//       setSettlingAll(false);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     const variants: Record<string, string> = {
//       pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
//       settled: "bg-green-100 text-green-800 border-green-200",
//       failed: "bg-red-100 text-red-800 border-red-200",
//     };

//     const icons: Record<string, any> = {
//       pending: Clock,
//       settled: CheckCircle,
//       failed: XCircle,
//     };

//     const Icon = icons[status] || Clock;

//     return (
//       <Badge variant="outline" className={variants[status]}>
//         <Icon className="w-3 h-3 mr-1" />
//         {status}
//       </Badge>
//     );
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString("en-IN");
//   };

//   return (
//     <div className="space-y-6 p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-800">Commissions</h2>
//           <p className="text-sm text-gray-600">
//             Track and manage platform commissions
//           </p>
//         </div>
//         <div className="flex gap-3">
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="Filter by status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Commissions</SelectItem>
//               <SelectItem value="pending">Pending</SelectItem>
//               <SelectItem value="settled">Settled</SelectItem>
//               <SelectItem value="failed">Failed</SelectItem>
//             </SelectContent>
//           </Select>

//           {summary && summary.pending.count > 0 && (
//             <Button
//               onClick={settleAllPending}
//               disabled={settlingAll}
//               className="bg-green-600 hover:bg-green-700"
//             >
//               {settlingAll ? (
//                 <>
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                   Settling...
//                 </>
//               ) : (
//                 "Settle All Pending"
//               )}
//             </Button>
//           )}
//           <div className=""></div>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       {summary && (
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div className="bg-white rounded-lg shadow-sm p-5">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm text-gray-600">Total Commission</p>
//               <DollarSign className="w-5 h-5 text-blue-600" />
//             </div>
//             <p className="text-2xl font-bold text-gray-800">
//               ₹{summary.total.amount}
//             </p>
//             <p className="text-xs text-gray-500 mt-1">
//               {summary.total.count} transactions
//             </p>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm p-5">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm text-gray-600">Pending</p>
//               <Clock className="w-5 h-5 text-yellow-600" />
//             </div>
//             <p className="text-2xl font-bold text-yellow-600">
//               ₹{summary.pending.amount }
//             </p>
//             <p className="text-xs text-gray-500 mt-1">
//               {summary.pending.count} pending
//             </p>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm p-5">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm text-gray-600">Settled</p>
//               <CheckCircle className="w-5 h-5 text-green-600" />
//             </div>
//             <p className="text-2xl font-bold text-green-600">
//               ₹{summary.settled.amount }
//             </p>
//             <p className="text-xs text-gray-500 mt-1">
//               {summary.settled.count} settled
//             </p>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm p-5">
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-sm text-gray-600">Failed</p>
//               <XCircle className="w-5 h-5 text-red-600" />
//             </div>
//             <p className="text-2xl font-bold text-red-600">
//               ₹{summary.failed.amount }
//             </p>
//             <p className="text-xs text-gray-500 mt-1">
//               {summary.failed.count} failed
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Table */}
//       <div className="border rounded-lg bg-white overflow-x-auto">
//         <Table>
//           <TableCaption>Platform commission transactions.</TableCaption>
//           <TableHeader>
//             <TableRow>
//               <TableHead>ID</TableHead>
//               <TableHead>Restaurant</TableHead>
//               <TableHead>Order Amount</TableHead>
//               <TableHead>Rate</TableHead>
//               <TableHead>Commission</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Date</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={8} className="text-center py-8">
//                   <Loader2 className="w-6 h-6 animate-spin mx-auto" />
//                   <p className="text-sm text-gray-500 mt-2">
//                     Loading commissions...
//                   </p>
//                 </TableCell>
//               </TableRow>
//             ) : commissions.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={8} className="text-center py-8">
//                   <p className="text-gray-500">No commissions found</p>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               commissions.map((commission) => (
//                 <TableRow key={commission.id}>
//                   <TableCell className="font-medium">
//                     #{commission.id}
//                   </TableCell>
//                   <TableCell>{commission.restaurant.name}</TableCell>
//                   <TableCell className="font-semibold">
//                     ₹{Number(commission.orderAmount) }
//                   </TableCell>
//                   <TableCell>{commission.commissionRate}%</TableCell>
//                   <TableCell className="font-semibold text-green-600">
//                     ₹{Number(commission.commissionAmount) }
//                   </TableCell>
//                   <TableCell>{getStatusBadge(commission.status)}</TableCell>
//                   <TableCell className="text-sm text-gray-600">
//                     {formatDate(commission.createdAt)}
//                   </TableCell>
//                   <TableCell className="text-right">
//                     {commission.status === "pending" && (
//                       <Button
//                         size="sm"
//                         onClick={() => settleCommission(commission.id)}
//                         disabled={settlingId === commission.id}
//                         className="bg-green-600 hover:bg-green-700"
//                       >
//                         {settlingId === commission.id ? (
//                           <Loader2 className="w-4 h-4 animate-spin" />
//                         ) : (
//                           "Settle"
//                         )}
//                       </Button>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { DollarSign, CheckCircle, Clock, XCircle, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Commission {
  id: number;
  restaurantId: number;
  orderId: number;
  orderAmount: string;
  commissionRate: string;
  commissionAmount: string;
  restaurantAmount: string;
  status: "pending" | "settled" | "failed";
  createdAt: string;
  restaurant: {
    id: number;
    name: string;
  };
}

interface CommissionSummary {
  summary: {
    total: { amount: number; count: number };
    pending: { amount: number; count: number };
    settled: { amount: number; count: number };
    failed: { amount: number; count: number };
  };
}

interface CommissionsResponse {
  statusCode: number;
  data: {
    commissions: Commission[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message: string;
  success: boolean;
}

interface PaymentSetup {
  restaurantId: number;
  fixedfee: number;
  precentagefee: number;
  minFee: number;
  maxFee: number;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary["summary"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [settlingAll, setSettlingAll] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentSetup>({
    restaurantId: 3,
    fixedfee: 0,
    precentagefee: 0,
    minFee: 0,
    maxFee: 0,
  });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchCommissions();
    fetchSummary();
  }, [statusFilter]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions`
      );
      if (statusFilter !== "all") {
        url.searchParams.append("status", statusFilter);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      const data: CommissionsResponse = await response.json();
      if (data.success) {
        setCommissions(data.data.commissions);
      } else {
        toast.error("Failed to fetch commissions");
      }
    } catch (error) {
      console.error("Error fetching commissions:", error);
      toast.error("Error loading commissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions/summary`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success && data.data) {
        setPaymentDetails(data.data);
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
      toast.error("Error loading payment details");
    }
  };

  const openPaymentDialog = async () => {
    await fetchPaymentDetails();
    setPaymentDialogOpen(true);
  };

  const updatePayment = async () => {
    try {
      setSavingPayment(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(paymentDetails),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Payment setup updated successfully");
        setPaymentDialogOpen(false);
        fetchCommissions();
        fetchSummary();
      } else {
        toast.error(data.message || "Failed to update payment setup");
      }
    } catch (error) {
      console.error("Error updating payment setup:", error);
      toast.error("Error updating payment setup");
    } finally {
      setSavingPayment(false);
    }
  };

  const settleCommission = async (commissionId: number) => {
    try {
      setSettlingId(commissionId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions/${commissionId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "settled" }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to settle commission");
      }
      toast.success("Commission settled successfully");
      fetchCommissions();
      fetchSummary();
    } catch (error: any) {
      console.error("Error settling commission:", error);
      toast.error(error.message || "Failed to settle commission");
    } finally {
      setSettlingId(null);
    }
  };

  const settleAllPending = async () => {
    if (!confirm("Settle all pending commissions?")) return;

    try {
      setSettlingAll(true);
      const pendingCommissions = commissions.filter((c) => c.status === "pending");
      if (pendingCommissions.length === 0) {
        toast.error("No pending commissions to settle");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions/settle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            commissionIds: pendingCommissions.map((c) => c.id),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to settle commissions");
      }

      toast.success(`${data.data.settledCount} commission(s) settled`);
      fetchCommissions();
      fetchSummary();
    } catch (error: any) {
      console.error("Error settling commissions:", error);
      toast.error(error.message || "Failed to settle commissions");
    } finally {
      setSettlingAll(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      settled: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
    };

    const icons: Record<string, any> = {
      pending: Clock,
      settled: CheckCircle,
      failed: XCircle,
    };

    const Icon = icons[status] || Clock;

    return (
      <Badge className={`${variants[status]} border`}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commissions</h1>
          <p className="text-gray-600">Track and manage platform commissions</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commissions</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={openPaymentDialog}
            variant="outline"
            size="icon"
            title="Edit Payment Settings"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {summary && summary.pending.count > 0 && (
            <Button
              onClick={settleAllPending}
              disabled={settlingAll}
              className="bg-green-600 hover:bg-green-700"
            >
              {settlingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Settling...
                </>
              ) : (
                "Settle All Pending"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Total Commission
              </p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">₹{summary.total.amount}</p>
              <p className="text-xs text-muted-foreground">
                {summary.total.count} transactions
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">₹{summary.pending.amount}</p>
              <p className="text-xs text-muted-foreground">
                {summary.pending.count} pending
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Settled</p>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">₹{summary.settled.amount}</p>
              <p className="text-xs text-muted-foreground">
                {summary.settled.count} settled
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Failed</p>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">₹{summary.failed.amount}</p>
              <p className="text-xs text-muted-foreground">
                {summary.failed.count} failed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableCaption>Platform commission transactions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Order Amount</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading commissions...
                  </p>
                </TableCell>
              </TableRow>
            ) : commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">No commissions found</p>
                </TableCell>
              </TableRow>
            ) : (
              commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>#{commission.id}</TableCell>
                  <TableCell>{commission.restaurant.name}</TableCell>
                  <TableCell>₹{Number(commission.orderAmount)}</TableCell>
                  <TableCell>{commission.commissionRate}%</TableCell>
                  <TableCell>₹{Number(commission.commissionAmount)}</TableCell>
                  <TableCell>{getStatusBadge(commission.status)}</TableCell>
                  <TableCell>{formatDate(commission.createdAt)}</TableCell>
                  <TableCell>
                    {commission.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => settleCommission(commission.id)}
                        disabled={settlingId === commission.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {settlingId === commission.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Settle"
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Settings</DialogTitle>
            <DialogDescription>
              Configure commission and payment fee settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* <div className="grid gap-2">
              <Label htmlFor="restaurantId">Restaurant ID</Label>
              <Input
                id="restaurantId"
                type="number"
                value={paymentDetails.restaurantId}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    restaurantId: Number(e.target.value),
                  })
                }
              />
            </div> */}
            <div className="grid gap-2">
              <Label htmlFor="fixedFee">Fixed Fee (₹)</Label>
              <Input
                id="fixedFee"
                type="number"
                step="0.01"
                value={paymentDetails.fixedfee}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    fixedfee: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="percentageFee">Percentage Fee (%)</Label>
              <Input
                id="percentageFee"
                type="number"
                step="0.01"
                value={paymentDetails.precentagefee}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    precentagefee: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minFee">Minimum Fee (₹)</Label>
              <Input
                id="minFee"
                type="number"
                step="0.01"
                value={paymentDetails.minFee}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    minFee: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxFee">Maximum Fee (₹)</Label>
              <Input
                id="maxFee"
                type="number"
                step="0.01"
                value={paymentDetails.maxFee}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    maxFee: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={savingPayment}
            >
              Cancel
            </Button>
            <Button onClick={updatePayment} disabled={savingPayment}>
              {savingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}