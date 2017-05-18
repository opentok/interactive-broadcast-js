// @flow
const snapshot = async (imgData: string): Promise.resolve<ImgData> =>
  new Promise((resolve: Promise.resolve<ImgData>, reject: Promise.reject<null>) => {
    const tempImg = document.createElement('img');
    tempImg.src = `data:image/png;base64,${imgData}`;
    tempImg.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 60;
      canvas.height = 60;
      if (ctx && tempImg) {
        ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);// $FlowFixMe
        resolve(canvas.toDataURL());
      } else { // $FlowFixMe
        reject(null);
      }
    };
  });

export default snapshot;
