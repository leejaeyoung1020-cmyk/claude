// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProfileCard } from "../components/ProfileCard";

afterEach(cleanup);

const baseProfile = {
  id: "user-1",
  avatarUrl: null,
  nickname: "지현",
  age: 23,
  department: "컴퓨터공학과",
  tags: ["게임", "등산"],
  bio: "안녕하세요, 반갑습니다",
};

describe("ProfileCard", () => {
  it("닉네임 · 나이 · 학과 · 태그 · 한 줄 소개를 보여준다", () => {
    render(<ProfileCard {...baseProfile} />);

    expect(screen.getByText("지현")).toBeInTheDocument();
    expect(screen.getByText("23세 · 컴퓨터공학과")).toBeInTheDocument();
    expect(screen.getByText("게임")).toBeInTheDocument();
    expect(screen.getByText("등산")).toBeInTheDocument();
    expect(screen.getByText("안녕하세요, 반갑습니다")).toBeInTheDocument();
  });

  it("클릭하면 /profile/[id]로 이동하는 링크다", () => {
    render(<ProfileCard {...baseProfile} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/profile/user-1");
  });

  it("아바타 이미지가 없으면 닉네임 첫 글자를 임시로 보여준다", () => {
    render(<ProfileCard {...baseProfile} />);

    expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("지");
  });
});
