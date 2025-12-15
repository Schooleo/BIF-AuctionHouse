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

  deleteImage: async (publicId: string): Promise<void> => {
    const url = `${API_BASE}/api/upload/delete`;
    const token = localStorage.getItem("token");

    await axios.post(
      url,
      { publicId },
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
  },

  getPublicIdFromUrl: (url: string): string | null => {
    try {
      // Extract everything after /v<version>/ and before the file extension
      const matches = url.match(/\/v\d+\/(.+)\.[a-zA-Z]+$/);
      if (matches && matches[1]) {
        return matches[1];
      }
      return null;
    } catch (error) {
      console.error("Error extracting public ID:", error);
      return null;
    }
  },
};
