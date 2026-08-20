import { fireEvent, render, screen } from "@testing-library/react";
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

test("가입 화면에서 ID 중복확인과 제한된 개인정보 입력 방식을 제공한다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/auth/check-id")) {
        return Promise.resolve(new Response(JSON.stringify({ available: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }
      return Promise.resolve(new Response(JSON.stringify({ error: "로그인이 필요합니다." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }));
    }),
  );

  render(<Home />);
  await screen.findByRole("tab", { name: "로그인" });
  fireEvent.click(screen.getByRole("tab", { name: "처음이에요" }));

  const idInput = screen.getByLabelText("ID");
  fireEvent.change(idInput, { target: { value: "FreshUser" } });
  fireEvent.click(screen.getByRole("button", { name: "중복확인" }));

  expect(await screen.findByText("사용할 수 있는 ID입니다.")).toBeInTheDocument();
  expect(idInput).toHaveValue("freshuser");
  expect(idInput).toHaveAttribute("pattern", "[a-z0-9]{3,20}");
  expect(idInput).toHaveAttribute("placeholder", "영문 소문자와 숫자");
  expect(screen.getByLabelText("PIN")).toHaveAttribute("maxlength", "6");
  expect(screen.getByLabelText("PIN")).toHaveAttribute("pattern", "[0-9]{4,6}");
  expect(screen.getByLabelText("출생연도")).toBeInstanceOf(HTMLSelectElement);
  expect(screen.getByRole("radio", { name: "남성" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "여성" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "기타" })).not.toBeInTheDocument();
});
