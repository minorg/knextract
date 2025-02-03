import { z } from "zod";

const groupSchema = z.object({ "#text": z.string(), "@_url": z.string() });

const meshHeadingSchema = z.object({
  descriptor: z.object({ "@_id": z.string(), "#text": z.string() }),
});

export const healthTopicsSchema = z.object({
  "health-topics": z.object({
    "@_date-generated": z.string().transform((arg) => {
      const [datePart, timePart] = arg.split(" ");
      const [month, day, year] = datePart.split("/");
      const [hours, minutes, seconds] = timePart.split(":");

      return new Date(
        Number.parseInt(year),
        Number.parseInt(month) - 1,
        Number.parseInt(day),
        Number.parseInt(hours),
        Number.parseInt(minutes),
        Number.parseInt(seconds),
      );
    }),
    "health-topic": z.array(
      z.object({
        "full-summary": z.string(),
        group: groupSchema.or(z.array(groupSchema)),
        "@_language": z.string(),
        "mesh-heading": meshHeadingSchema
          .or(z.array(meshHeadingSchema))
          .optional(),
        "@_title": z.string(),
        "@_url": z.string(),
      }),
    ),
  }),
});
