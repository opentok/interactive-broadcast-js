const createSnapshot = (imgData: ImgData, onSnapshotReady: OnSnapshotReady) => {
  const tempImg = document.createElement('img');
  tempImg.src = `data:image/png;base64,${imgData}`;
  tempImg.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 60;
    canvas.height = 60;
    ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
    onSnapshotReady(canvas.toDataURL());
  };
};

module.exports = {
  createSnapshot,
};
