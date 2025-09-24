// Simple test script to debug keeper startup
console.log("Starting keeper test...");

process.env.DEMO_MODE = 'true';

async function testKeeper() {
  try {
    console.log("Importing keeper...");
    const keeperModule = await import('./improved-keeper.js');
    console.log("Keeper imported successfully");

    const keeperInstance = new keeperModule.default();
    console.log("Keeper instance created");

    await keeperInstance.initialize();
    console.log("Keeper initialized");

    await keeperInstance.start();
    console.log("Keeper started successfully!");

    // Let it run for 5 seconds
    setTimeout(async () => {
      console.log("Stopping keeper...");
      await keeperInstance.stop();
      console.log("Keeper stopped");
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testKeeper();
