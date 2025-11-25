import { RouterProvider } from "react-router";
import { AppProvider } from './utils/appStore';
import { router } from "./utils/routes";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AppProvider>
  );
}
