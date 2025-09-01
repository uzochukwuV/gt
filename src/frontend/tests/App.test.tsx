import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";
import { StrictMode } from "react";
import { act } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";

describe("App", () => {
  it("renders the landing page", async () => {
    await act(async () => {
      render(
        <StrictMode>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </StrictMode>,
      );
    });

    // After act completes, all state updates from useEffect should be processed
    expect(screen.getByText("PropertyTrust")).toBeInTheDocument();
  });
});
