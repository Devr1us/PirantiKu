export type BookingInput = {
  equipmentId: string;
  startDate: string;
  endDate: string;
  quantity: number;
};

export function validateBookingInput(input: BookingInput): string[] {
  const errors: string[] = [];

  if (!input.equipmentId) errors.push("Alat wajib dipilih.");
  if (!input.startDate) errors.push("Tanggal mulai wajib diisi.");
  if (!input.endDate) errors.push("Tanggal selesai wajib diisi.");
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    errors.push("Tanggal selesai tidak boleh sebelum tanggal mulai.");
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    errors.push("Jumlah alat minimal 1.");
  }

  return errors;
}
