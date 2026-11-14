import { z } from "zod";

export const contactProfile = z.object({
  first_name: z.string().trim().max(100),
  last_name: z.string().trim().max(100),
  email: z.string().trim().toLowerCase().max(254).email(),
});
