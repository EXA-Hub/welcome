import React, { useState, useEffect, useRef } from "react";
import WelcomeImage from "./helpers/welcomeImage";
import { Spinner } from "react-bootstrap";
import { useAlert } from "react-alert";
import useImage from "use-image";


export default function WelcomeCard() {
  let stateData = JSON.parse(localStorage.getItem("state"));
  const alert = useAlert();
  let ref = useRef(0);
  const [welcomeImageData, setWelcomeImageData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [image, status] = useImage(imageUrl, 'Anonymous');

  useEffect(() => {
    if (!stateData) {
      fetch('/data.json')
        .then(response => response.json())
        .then(data => {
          setWelcomeImageData(data);
          if (!imageUrl) {
            setImageUrl(data.AvatarData.url);
          }
        });
    } else {
      const data = stateData.data;
      setWelcomeImageData(data);
      if (!imageUrl) {
        setImageUrl(data.AvatarData.url);
      }
    }
  }, [imageUrl, stateData]);

  if (status !== 'loaded') {
    return (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">جار جلب المعلومات المطلوبة...</span>
      </Spinner>
    );
  }

  return (
    <WelcomeImage
      alert={alert}
      stateData={stateData}
      welcomeImageData={welcomeImageData}
      image={image}
      avImageData={ref.current || function name() {
        stateData.image = image;
        ref.current = image;
        return image
      }}
    />
  );
}
