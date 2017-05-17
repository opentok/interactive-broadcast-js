// @flow
const snapshot = (imgData: ImgData): Promise.resolve<ImgData> =>
  new Promise((resolve: ImgData => void) => {
    const tempImg = document.createElement('img');
    tempImg.src = `data:image/png;base64,${imgData}`;
    tempImg.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 60;
      canvas.height = 60; // $FlowFixMe
      ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL());
    };
  });

export default snapshot;
