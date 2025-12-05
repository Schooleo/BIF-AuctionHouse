import axios from "axios";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

interface UploadResponse {
  url: string;
  publicId: string;
}

export const uploadApi = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const url = `${API_BASE}/api/upload`;
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("token");

    const res = await axios.post<UploadResponse>(url, formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
