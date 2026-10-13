import { ApiError, api } from "@/services/api";
import { UPLOAD_ENDPOINTS } from "@/services/endpoints";

export type UploadedImageData = {
  key: string;
  url: string;
  cdnUrl: string;
  filename: string;
};

type UploadImageApiResponse = {
  status?: boolean;
  message?: string;
  data?: UploadedImageData;
};

/** POST /admin/uploads/images — multipart: path, image (file) */
export async function uploadImage(file: File, path: string) {
  const formData = new FormData();
  formData.append("path", path);
  formData.append("image", file);

  const response = await api.post<UploadImageApiResponse>(
    UPLOAD_ENDPOINTS.images,
    formData,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not upload image.",
      400,
      response,
    );
  }

  const data = response.data;
  if (!data?.key || !data.url || !data.cdnUrl || !data.filename) {
    throw new ApiError(
      "Image uploaded but required fields were missing in the response.",
      200,
      response,
    );
  }

  return data;
}

export function uploadBannerImage(file: File) {
  return uploadImage(file, "banners");
}
