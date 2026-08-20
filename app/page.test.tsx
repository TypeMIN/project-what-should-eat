import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import Home from "@/app/page";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("로그인하지 않은 사용자는 서비스 소개와 로그인 화면을 본다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "로그인이 필요합니다." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );

  render(<Home />);

  expect(await screen.findByRole("heading", { level: 1, name: /고민은 짧게/ })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "로그인" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByLabelText("ID")).toBeRequired();
  expect(screen.queryByText(/못 먹는 음식/)).not.toBeInTheDocument();
});
