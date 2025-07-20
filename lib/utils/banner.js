// function printBanner() {
//   console.log(
//     `\x1b[36m%s\x1b[0m`,
//     `
//     ███████╗██╗  ██╗ ██████╗ ███████╗███╗   ██╗
//     ██╔════╝╚██╗██╔╝██╔════╝ ██╔════╝████╗  ██║
//     █████╗   ╚███╔╝ ██║  ███╗█████╗  ██╔██╗ ██║
//     ██╔══╝   ██╔██╗ ██║   ██║██╔══╝  ██║╚██╗██║
//     ███████╗██╔╝ ██╗╚██████╔╝███████╗██║ ╚████║
//     ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝
// \n✨ Express API Structure Generator (EXGEN CLI) ✨\n`
//   );
// }
// module.exports = { printBanner };

function printBanner() {
  const cyan = "\x1b[36m";
  const magenta = "\x1b[35m";
  const yellow = "\x1b[33m";
  const reset = "\x1b[0m";

  const borderTop = `${cyan}++--------------------------------------------------++${reset}`;
  const borderBottom = `${magenta}++--------------------------------------------------++${reset}`;
  const innerEmpty = `${yellow}||                                                  ||${reset}`;
  const logoLines = [
    "||   _____________  _______________________   __    ||",
    "||   ___  ____/_  |/ /_  ____/__  ____/__  | / /    ||",
    "||   __  __/  __    /_  / __ __  __/  __   |/ /     ||",
    "||   _  /___  _    | / /_/ / _  /___  _  /|  /      ||",
    "||   /_____/  /_/|_| \\____/  /_____/  /_/ |_/       ||",
  ].map((line) => `${cyan}${line}${reset}`);

  console.log("\n" + borderTop);
  console.log(borderBottom);
  console.log(innerEmpty);
  logoLines.forEach((line) => console.log(line));
  console.log(innerEmpty);
  console.log(innerEmpty);
  console.log(borderTop);
  console.log(borderBottom + "\n");
  console.log(
    `${magenta}✨ Express API Structure Generator (EXGEN CLI) ✨${reset}\n`
  );
}

module.exports = { printBanner };
