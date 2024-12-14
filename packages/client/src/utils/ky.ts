import api from "ky";

const ky = api.extend({
  retry: { methods: ["get", "head", "options"], limit: 2 },
});

export { ky };
