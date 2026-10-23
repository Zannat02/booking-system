export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; isActive: boolean };
}

// Plan-er vitore thaka service-er chhoto version
export interface PlanService {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  credits: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services: PlanService[];
}

export interface Slot {
  id: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  remainingSeats: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  };
  staff: { id: string; name: string };
}