import * as XLSX from 'xlsx';
import { Patient, Booking, Expense, InventoryItem, Income } from '../types/clinic';

export function exportPatientsToExcel(patients: Patient[]) {
  const data = patients.map((p, idx) => ({
    'S.No': idx + 1,
    'Patient Name': p.name,
    'Phone': p.phone,
    'Age': p.age,
    'Gender': p.gender,
    'Total Visits': p.totalVisits || 1,
    'Last Visit': p.lastVisit,
    'Address': p.address || 'N/A',
    'Clinical Notes': p.notes || 'N/A',
    'Registered Date': p.createdAt
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
  XLSX.writeFile(workbook, `Anujay_Dental_Patients_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportBookingsToExcel(bookings: Booking[]) {
  const data = bookings.map((b, idx) => ({
    'S.No': idx + 1,
    'Patient Name': b.patientName,
    'Phone': b.phone,
    'Service': b.service,
    'Appointment Date': b.date,
    'Time Slot': b.timeSlot,
    'Status': b.status,
    'Payment Status': b.paymentStatus,
    'Fee (INR)': b.fee,
    'Problem': b.problemDescription || 'N/A',
    'Booked At': b.createdAt
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
  XLSX.writeFile(workbook, `Anujay_Dental_Bookings_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportExpensesToExcel(expenses: Expense[]) {
  const data = expenses.map((e, idx) => ({
    'S.No': idx + 1,
    'Expense Item': e.name,
    'Category': e.category,
    'Amount (INR)': e.amount,
    'Date': e.date,
    'Notes': e.notes || 'N/A',
    'Logged At': e.createdAt
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
  XLSX.writeFile(workbook, `Anujay_Dental_Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportInventoryToExcel(items: InventoryItem[]) {
  const data = items.map((i, idx) => ({
    'S.No': idx + 1,
    'Medicine / Item': i.name,
    'Category': i.category,
    'Quantity': i.quantity,
    'Unit': i.unit,
    'Min Threshold': i.minThreshold || 10,
    'Stock Status': i.quantity <= (i.minThreshold || 10) ? 'LOW STOCK' : 'IN STOCK',
    'Last Updated': i.updatedAt
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
  XLSX.writeFile(workbook, `Anujay_Dental_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportIncomeToExcel(income: Income[]) {
  const data = income.map((i, idx) => ({
    'S.No': idx + 1,
    'Patient / Source': i.source,
    'Treatment / Service': i.service,
    'Amount (INR)': i.amount,
    'Date': i.date,
    'Payment Mode': i.paymentMode,
    'Notes': i.notes || 'N/A',
    'Logged At': i.createdAt
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Income');
  XLSX.writeFile(workbook, `Anujay_Dental_Income_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
