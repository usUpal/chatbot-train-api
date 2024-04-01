function generateRandomName() {
    const randomNumber = Math.floor(Math.random() * 9000) + 1000; // Generates a random number between 1000 and 9999
    const randomName = `Index${randomNumber}`;
    return randomName;
  }

export {generateRandomName}