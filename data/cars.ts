// This file acts as a mock database for your car data.
// In a real application, this data would come from a database or external API.

import { type Car } from '@/app/showroom/page';

export const mockCarsData: Car[] = [
  {
    id: "1", licensePlate: "ABC-123", brand: "Toyota", model: "Camry", year: 2020, color: "White", mileage: 25000, purchasePrice: 18000, salePrice: 22000, purchaseDate: "2023-01-15", saleDate: "2023-06-10", clientId: "client1", status: "sold", description: "Excellent condition, well maintained", createdAt: "2023-01-15T10:00:00Z", updatedAt: "2023-06-10T14:30:00Z"
  },
  {
    id: "2", licensePlate: "XYZ-789", brand: "Honda", model: "Civic", year: 2019, color: "Blue", mileage: 45000, purchasePrice: 15000, purchaseDate: "2023-03-20", status: "available", description: "Good condition, minor scratches", createdAt: "2023-03-20T09:00:00Z", updatedAt: "2023-03-20T09:00:00Z"
  },
  {
    id: "3", licensePlate: "DEF-456", brand: "Ford", model: "Focus", year: 2021, color: "Red", mileage: 15000, purchasePrice: 16000, salePrice: 19000, purchaseDate: "2023-02-01", saleDate: "2023-07-20", clientId: "client2", status: "sold", description: "Sporty and efficient", createdAt: "2023-02-01T11:00:00Z", updatedAt: "2023-07-20T16:00:00Z"
  },
  {
    id: "4", licensePlate: "GHI-012", brand: "BMW", model: "X5", year: 2022, color: "Black", mileage: 10000, purchasePrice: 50000, purchaseDate: "2023-04-05", status: "reserved", description: "Luxury SUV, low mileage", createdAt: "2023-04-05T13:00:00Z", updatedAt: "2023-04-05T13:00:00Z"
  },
  {
    id: "5", licensePlate: "JKL-345", brand: "Toyota", model: "Corolla", year: 2021, color: "Silver", mileage: 18000, purchasePrice: 17000, purchaseDate: "2023-05-01", status: "available", description: "Fuel-efficient sedan", createdAt: "2023-05-01T08:00:00Z", updatedAt: "2023-05-01T08:00:00Z"
  },
  {
    id: "6", licensePlate: "MNO-678", brand: "Honda", model: "CR-V", year: 2022, color: "Gray", mileage: 12000, purchasePrice: 28000, salePrice: 32000, purchaseDate: "2023-06-10", saleDate: "2023-08-01", clientId: "client3", status: "sold", description: "Spacious family SUV", createdAt: "2023-06-10T10:00:00Z", updatedAt: "2023-08-01T11:00:00Z"
  },
  {
    id: "7", licensePlate: "PQR-901", brand: "Mercedes-Benz", model: "C-Class", year: 2023, color: "White", mileage: 5000, purchasePrice: 40000, purchaseDate: "2023-07-15", status: "available", description: "Luxury compact sedan", createdAt: "2023-07-15T14:00:00Z", updatedAt: "2023-07-15T14:00:00Z"
  },
  {
    id: "8", licensePlate: "STU-234", brand: "Audi", model: "A4", year: 2020, color: "Black", mileage: 30000, purchasePrice: 25000, salePrice: 28000, purchaseDate: "2023-08-01", saleDate: "2023-09-05", clientId: "client1", status: "sold", description: "Sleek design, comfortable ride", createdAt: "2023-08-01T09:00:00Z", updatedAt: "2023-09-05T10:00:00Z"
  },
  {
    id: "9", licensePlate: "VWX-567", brand: "Tesla", model: "Model 3", year: 2023, color: "Red", mileage: 8000, purchasePrice: 35000, purchaseDate: "2023-09-10", status: "available", description: "Electric vehicle, long range", createdAt: "2023-09-10T11:00:00Z", updatedAt: "2023-09-10T11:00:00Z"
  },
  {
    id: "10", licensePlate: "YZA-890", brand: "Nissan", model: "Rogue", year: 2022, color: "Silver", mileage: 20000, purchasePrice: 23000, purchaseDate: "2023-10-01", status: "available", description: "Compact SUV, reliable", createdAt: "2023-10-01T13:00:00Z", updatedAt: "2023-10-01T13:00:00Z"
  },
  {
    id: "11", licensePlate: "QWE-111", brand: "Toyota", model: "RAV4", year: 2022, color: "Green", mileage: 15000, purchasePrice: 25000, purchaseDate: "2023-11-01", status: "available", description: "Popular SUV", createdAt: "2023-11-01T09:00:00Z", updatedAt: "2023-11-01T09:00:00Z"
  },
  {
    id: "12", licensePlate: "RTY-222", brand: "Honda", model: "Accord", year: 2020, color: "Black", mileage: 35000, purchasePrice: 19000, salePrice: 21500, purchaseDate: "2023-12-01", saleDate: "2024-01-10", clientId: "client2", status: "sold", description: "Reliable mid-size sedan", createdAt: "2023-12-01T10:00:00Z", updatedAt: "2024-01-10T12:00:00Z"
  },
];
