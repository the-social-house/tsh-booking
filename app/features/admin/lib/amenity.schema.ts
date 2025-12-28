import { z } from "zod";
import messages from "@/lib/messages.json";

/**
 * Schema for creating a new amenity
 */
export const createAmenitySchema = z.object({
  amenity_name: z
    .string()
    .min(1, messages.amenities.validation.name.required)
    .min(2, messages.amenities.validation.name.minLength)
    .max(100, messages.amenities.validation.name.maxLength)
    .trim(),
  amenity_price: z
    .number()
    .min(0, messages.amenities.validation.price.min)
    .max(99_999.99, messages.amenities.validation.price.max)
    .nullable()
    .optional(),
});

/**
 * Schema for updating an amenity (all fields optional)
 */
export const updateAmenitySchema = z.object({
  amenity_name: createAmenitySchema.shape.amenity_name.optional(),
  amenity_price: createAmenitySchema.shape.amenity_price.optional(),
});

export type CreateAmenityInput = z.infer<typeof createAmenitySchema>;
export type UpdateAmenityInput = z.infer<typeof updateAmenitySchema>;

/**
 * Schema for validating amenity IDs (used for update/delete)
 */
export const amenityIdSchema = z.object({
  id: z.uuid(messages.amenities.validation.id.uuid),
});

export type AmenityIdInput = z.infer<typeof amenityIdSchema>;
