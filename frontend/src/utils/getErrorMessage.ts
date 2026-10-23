import axios from "axios";

interface ApiErrorBody {
  message?: string;
  errors?: { field: string; message: string }[];
}

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    if (data?.errors && data.errors.length > 0) {
      return data.errors.map((item) => item.message).join(", ");
    }
    if (data?.message) {
      return data.message;
    }
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Please check your connection and try again.";
    }
  }
  return fallback;
};