export type EquipmentCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Equipment = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  pricePerDay: number;
  stock: number;
  imageUrl: string | null;
};

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Booking = {
  id: string;
  userId: string;
  equipmentId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  totalPrice: number;
  status: BookingStatus;
};
