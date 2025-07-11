import { main } from "./src/cli";

try {
  await main(process.argv.slice(2));
} catch (error) {
  if (process.env.NEXUS_IDL_DEBUG) {
    console.error(error);
  } else {
    console.error(`${error}`);
  }
  process.exit(1);
}
