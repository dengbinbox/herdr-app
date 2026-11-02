import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

// Exercise the shipped menu with a different terminal already focused.
const source = (await readFile(new URL("../defaults/mods/menu/main.js", import.meta.url), "utf8"))
  .replace(/^import .*;\n/gm, "").replace("export default class Menu", "class Menu");

for (const address of ["t2", "vps/t2"]) {
  test(`clipboard actions retain the clicked target ${address} after closing the menu`, () => {
    const calls: unknown[][] = [];
    let focused = "t1";
    const p = { tab: "pane", target: { pane: "p2", terminal: address }, overlay: "menu-overlay" };
    const { Menu, items } = new Function("View", "props", "terminals", "closeOverlay", "run", `${source}; return { Menu, items };`)(
      class {}, () => p, () => [{ address, labels: {} }],
      (id: string) => { focused = "t1"; calls.push(["close", id]); },
      (command: string, args: any) => calls.push([command, args.terminal ?? focused]),
    );
    const menu = new Menu();
    const choices = items(p, null);
    for (const command of ["terminal.copy", "terminal.paste"]) {
      calls.length = 0;
      menu.choose(choices.findIndex((item: any[]) => item[1] === command), {});
      expect(calls).toEqual([["close", "menu-overlay"], [command, address]]);
    }
    expect(choices.filter((item: any[]) => item[1] === "pane.split").map((item: any[]) => item[2].pane)).toEqual(["p2", "p2"]);
  });
}
