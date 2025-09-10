import { NextResponse } from 'next/server';

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api';

export async function GET() {
  try {
    console.log('Fetching car brands from NHTSA API...');
    
    // Get makes for vehicle type "car" only
    const url = `${NHTSA_BASE_URL}/vehicles/GetMakesForVehicleType/car?format=json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CarDealerApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.Results || !Array.isArray(data.Results)) {
      throw new Error('Invalid response format from NHTSA API');
    }

    // Extract and sort brand names
    const brands = data.Results
      .map((make: any) => make.MakeName)
      .filter((name: string) => name && name.trim() !== '') // Remove empty names
      .sort((a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' })); // Case-insensitive sort

    // Remove duplicates (just in case)
    const uniqueBrands = Array.from(new Set(brands));
    
    console.log(`Successfully fetched ${uniqueBrands.length} car brands`);
    
    return NextResponse.json(uniqueBrands);
  } catch (error) {
    console.error('Error fetching car brands:', error);
    
    // Return common car brands as fallback
    const fallbackBrands = [
      'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 
      'Dodge', 'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 
      'Jeep', 'Kia', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 
      'Nissan', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
    ];
    
    return NextResponse.json(fallbackBrands);
  }
}