import api, { HTTPError } from "ky";

const ky = api.extend({
  retry: { methods: ["get", "head", "options"], limit: 2 },
  hooks: {
    beforeError: [
      async (e: HTTPError) => {
        if (
          e.response.headers.get("content-type") === "text/plain; charset=utf-8"
        ) {
          e.message = await e.response.text();
        }

        return e;
      },
    ],
  },
});

export { ky };
