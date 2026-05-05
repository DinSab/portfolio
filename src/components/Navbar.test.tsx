import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import Navbar from "@/components/Navbar";

function renderNavbarWithSections() {
  render(
    <>
      <Navbar />
      <main>
        <section id="home">home</section>
        <section id="chat">chat</section>
        <section id="about">about</section>
        <section id="experience">experience</section>
        <section id="skills">skills</section>
        <section id="spotify">spotify</section>
      </main>
    </>
  );
}

describe("Navbar", () => {
  it("scrolls to section and updates URL hash when a nav link is clicked", async () => {
    const user = userEvent.setup();
    const replaceStateSpy = jest.spyOn(window.history, "replaceState");
    renderNavbarWithSections();

    await user.click(screen.getByRole("link", { name: /about/i }));

    const aboutSection = document.getElementById("about");
    expect(aboutSection?.scrollIntoView).toHaveBeenCalled();
    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "#about");
  });
});
