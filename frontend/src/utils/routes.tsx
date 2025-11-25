import { createBrowserRouter } from "react-router";
import { Root } from "../pages/Root";
import { Inbox } from "../pages/Inbox";
import { PromptBrain } from "../pages/PromptBrain";
import { EmailAgent } from "../pages/EmailAgent";
import { Drafts } from "../pages/Drafts";
import { Settings } from "../pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Inbox /> },
      { path: "prompt-brain", element: <PromptBrain /> },
      { path: "email-agent", element: <EmailAgent /> },
      { path: "email-agent/:emailId", element: <EmailAgent /> },
      { path: "drafts", element: <Drafts /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
