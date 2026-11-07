import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import Settings from "../src/renderer/src/components/Settings.jsx"
import { SettingsProvider, useSettings } from "../src/renderer/src/hooks/useSettings.jsx"
import { UIProvider } from "../src/renderer/src/hooks/useUI.jsx"

function StoredDeadzone() {
  const { dragDeadzone } = useSettings()
  return <output data-testid="stored">{dragDeadzone}</output>
}

// dragDeadzone starts at 20 and has min: 1
function setup() {
  const { container } = render(
    <SettingsProvider>
      <UIProvider>
        <Settings />
        <StoredDeadzone />
      </UIProvider>
    </SettingsProvider>
  )
  fireEvent.click(screen.getByText("Behaviour"))

  const control = container.querySelector(".number-control")
  const [minus, plus] = control.querySelectorAll("button")
  return { input: control.querySelector("input"), minus, plus }
}
const stored = () => screen.getByTestId("stored").textContent

describe("NumberControl", () => {
  it("shows the current setting", () => {
    const { input } = setup()
    expect(input.value).toBe("20")
  })

  it("+ and - change the setting", () => {
    const { plus, minus } = setup()
    fireEvent.click(plus)
    expect(stored()).toBe("21")
    fireEvent.click(minus)
    fireEvent.click(minus)
    expect(stored()).toBe("19")
  })

  it("- stops at min", () => {
    const { input, minus } = setup()
    fireEvent.change(input, { target: { value: "2" } })
    fireEvent.blur(input)

    fireEvent.click(minus)
    fireEvent.click(minus)

    expect(stored()).toBe("1")
    expect(input.value).toBe("1")
  })

  it("never stores a typed value below min", () => {
    const { input } = setup()

    fireEvent.change(input, { target: { value: "-5" } })
    expect(stored()).not.toBe("-5")

    fireEvent.blur(input)
    expect(stored()).toBe("1")
    expect(input.value).toBe("1")
  })
})
