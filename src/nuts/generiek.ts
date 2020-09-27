export default {
  /**
   * promise achtige vertrager. syntax als
   * nuts.time(5000).then(func) of await nuts.time(5000);
   * @param func
   * @param tijd
   */
  time(tijd: number) {
    return new Promise((goed) => {
      setTimeout(goed, tijd);
    });
  }
};
