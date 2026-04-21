import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: "::",
      port: 8088,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "midtrans-mock-api",
        configureServer(server) {
          server.middlewares.use("/api/midtrans-token", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end(JSON.stringify({ message: "Method Not Allowed" }));
              return;
            }
            
            let body = "";
            req.on("data", (chunk) => (body += chunk.toString()));
            req.on("end", async () => {
              try {
                // Gunakan dynamic import CJS untuk Midtrans
                const Midtrans = (await import("midtrans-client")).default;
                const snap = new Midtrans.Snap({
                  isProduction: false,
                  serverKey: (env.MIDTRANS_SERVER_KEY || "Mid-server-YOUR_SERVER_KEY").trim(),
                  clientKey: (env.VITE_MIDTRANS_CLIENT_KEY || "Mid-client-YOUR_CLIENT_KEY").trim(),
                });
                
                const { order_id, gross_amount, customer_details, item_details } = JSON.parse(body);
                
                const parameter = {
                  transaction_details: {
                    order_id: order_id || "ORDER-" + Math.floor(Math.random() * 1000000),
                    gross_amount: gross_amount,
                  },
                  customer_details: customer_details,
                  item_details: item_details,
                };
                
                const transaction = await snap.createTransaction(parameter);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ token: transaction.token, redirect_url: transaction.redirect_url }));
              } catch (error: any) {
                console.error("Midtrans Dev Mock Error:", error);
                res.statusCode = 500;
                res.end(JSON.stringify({ message: "Internal Server Error", error: error.message }));
              }
            });
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  }
});
