import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/v1/residents", () => {
    return HttpResponse.json({
      data: [
        { id: "r1", name: "John Doe", unit: "A-101", phone: "+1 555-1111" },
        { id: "r2", name: "Jane Smith", unit: "B-203", phone: "+1 555-2222" },
        { id: "r3", name: "Ravi Kumar", unit: "C-307" }
      ]
    });
  }),
];