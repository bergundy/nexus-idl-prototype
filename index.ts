import arg from "arg";

const args = arg({
  "--help": Boolean,
  "-h": "--help",
});

if (args["--help"]) {
  console.log("Usage: nexus-idl [options]");
  process.exit(0);
}

console.log("Hello, world!");
