import React, { Component } from "react";
import { Image as KonvaImage, Stage, Layer, Text } from "react-konva";
import { Card, Form, Button, Spinner, Modal, Dropdown } from "react-bootstrap";
import TransformerComponent from "./transformer";
import useImage from "use-image";
import axios from 'axios';
import ColorPicker from 'react-best-gradient-color-picker';
import gradient from 'gradient-parser';
import _ from 'lodash'; // for debounce and isEqual functions

let serverHosts = [];

let serverHost = serverHosts[0];

async function getServerHost() {
  fetch('/urls.json')
    .then(response => response.json())
    .then(async (data) => {
      serverHosts = serverHosts.push(...data);
      for (let host of serverHosts) {
        try {
          const response = await fetch(`${host}/test?testCode=ZAMPX`, {
            method: 'GET'
          });

          if (await response.text() === "this is the host") {
            serverHost = host; // store the first host that responds ok in serverHost
            return;
          }
        } catch (error) {
          console.log(`Error with host ${host}: `, error);
        }
      }

      throw new Error('No valid host found');
    });
}

getServerHost()
  .then(() => console.log(`Server host is ${serverHost}`))
  .catch(error => console.error(error));


const welcomeTextHint = "{{name}} {{tag}} {{discordTag}} {{memberCount}}";
const BackgroundImage = ({ data }) => {
  const [image] = useImage(data.background, 'Anonymous');
  return (
    <KonvaImage
      x={0}
      y={0}
      fillPatternImage={image}
      width={image ? image.width : data.width || 720}
      height={image ? image.height : data.height || 480}
    />
  );
};

export default class welcomeCard extends Component {
  constructor(props) {
    super(props);
    this.stageRef = React.createRef();
    const stateDataJson = this.props.stateData;
    if (!stateDataJson) {
      this.state = {
        selectedShapeName: "Avatar",
        image: null,
        data: this.props.welcomeImageData,
        av: this.props.avImageData,
        colorStops: [0, this.props.welcomeImageData.TextData.fill],
        color: this.props.welcomeImageData.TextData.fill,
        gradientType: 'solid',
        gradientTypeDegre: 90,
        textHeight: this.props.welcomeImageData.TextData.fontSize / 2,
        textWidth: this.props.welcomeImageData.TextData.fontSize / 2
      };
    } else {
      this.state = stateDataJson;
      this.state.av = this.props.avImageData;
      this.state.data = this.props.welcomeImageData;
      this.state.image = this.props.image;
    }
  }

  handleDownloadImage = async () => {
    const dataUrl = this.stageRef.current.toDataURL();
    // Now you can download the image using the dataUrl
    // or send it to a server
    // create a link and click it to start the download
    const link = document.createElement('a');
    link.download = 'myImage.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  handleSendImage = async () => {
    this.props.alert.info("الإرسال قيد التنفيذ", {
      timeout: 5 * 2000,
    });
    const dataUrl = this.stageRef.current.toDataURL();
    // Now you can download the image using the dataUrl
    // or send it to a server
    // create a link and click it to start the download
    // convert base64 to Blob
    const base64Response = await fetch(dataUrl);
    const imgBlob = await base64Response.blob();

    // create form data
    const formData = new FormData();
    formData.append('file', imgBlob, 'myImage.png');

    // add your text content
    if (this.state.DiscordMsg) formData.append('content', this.state.DiscordMsg);

    const queryParams = new URLSearchParams(window.location.search);
    let paramsObj = {};
    for (let param of queryParams) {
      paramsObj[param[0]] = param[1];
    }

    // specify the discord webhook url
    let { webhookUrl } = paramsObj;

    if (!webhookUrl) webhookUrl = this.state.webhookUrl;

    if (!webhookUrl) {
      this.props.alert.removeAll();
      this.props.alert.info("يرجى إضافة ويب هوك", {
        timeout: 5 * 2000,
      });

      this.setState({ ask: true });

      return;
    }


    // send the request
    axios.post(webhookUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then((response) => {
        this.props.alert.show("تم إرسال الترحيب", {
          timeout: 5 * 2000,
          type: "success",
        });
      })
      .catch((error) => {
        console.error('Error sending message to Discord: ', error);
        this.props.alert.show("حدث خطأ ما", {
          timeout: 5 * 2000,
          type: "error",
        });
        this.setState({ ask: true });
        this.props.alert.info("يرجى إضافة ويب هوك", {
          timeout: 5 * 2000,
        });
      });
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.color !== prevState.color ||
      this.state.colorStops !== prevState.colorStops ||
      this.state.gradientType !== prevState.gradientType
    ) {
      this.updateGradient();
    }
  }

  updateGradient() {
    if (!this.state.color.startsWith('rgba')) {
      var obj = gradient.parse(this.state.color);

      // Set the gradient type based on the parsed gradient
      this.setState({ gradientType: obj[0].type });
      if (this.state.gradientType.startsWith('linear')) this.setState({ gradientTypeDegre: obj[0].orientation.value });

      let stops = obj[0].colorStops.map(colorStop => {
        let stop = parseFloat(colorStop.length.value) / 100;
        return stop;
      });

      let colors = obj[0].colorStops.map(colorStop => {
        let color = `rgba(${colorStop.value.join(',')})`;
        return color;
      });

      // Reverse only the colors
      stops = stops.reverse();
      stops = stops.map(stop => (stop - 1) * -1);
      colors = colors.reverse();

      // Combine stops and colors back into one array
      let result = _.zip(stops, colors).flat();

      result = [].concat(...result);

      // Only update state if color stops have changed
      if (!_.isEqual(result, this.state.colorStops)) {
        this.setState({ colorStops: result });
      }
    } else if (this.state.color !== this.state.colorStops[1]) {
      this.setState({
        gradientType: "solid",
        colorStops: [0, this.state.color]
      });
    }
  }

  componentDidMount() {
    this.updateGradient();
    if (this.state.data.TextData.font) {
      const file = this.state.data.TextData.font;
      fetch(file)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const font = new FontFace('Uploaded Font', e.target.result);
            font.load().then((loadedFont) => {
              document.fonts.add(loadedFont);
              this.setState({ font: 'Uploaded Font' });
            }).catch((error) => {
              console.error('Error loading font: ', error);
              this.props.alert.show("حدث خطأ ما", {
                timeout: 5 * 2000,
                type: "error",
              });
            });
          };
          reader.readAsArrayBuffer(blob);
        }).catch(console.error);
    }
    const image = new window.Image();
    image.src = this.props.welcomeImageData.AvatarData.url;
    image.onload = () => {
      this.setState({
        image: image,
      });
    };
  }

  handleFontUpload = (event) => {
    this.setState({ uploading: true }); // Set uploading to true when the upload starts
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const font = new FontFace('Uploaded Font', e.target.result);
      font.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        this.setState({ font: 'Uploaded Font' });

        // Create a FormData object and append the file
        const formData = new FormData();
        formData.append('file', file);

        // Send the file to the server
        axios.post(serverHost + '/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(response => {
          this.setState({ uploading: false }); // Set uploading to false when the upload finishes
          this.setState({ font: loadedFont.family }); // Save the font family name in the state
          this.setState(prevState => ({
            data: {
              ...prevState.data,
              TextData: {
                ...prevState.data.TextData,
                font: serverHost + '/' + response.data.filePath
              }
            }
          }));
          console.log(this.state)
        }).catch(error => {
          console.error(error);
          this.props.alert.show("حدث خطأ ما", {
            timeout: 5 * 2000,
            type: "error",
          });
        });

      }).catch((error) => {
        console.error('Error loading font: ', error);
        this.props.alert.show("حدث خطأ ما", {
          timeout: 5 * 2000,
          type: "error",
        });
      });
    };
    reader.readAsArrayBuffer(file);
  };


  getImageSize = async (url) => {
    const img = new Image();
    img.src = url;
    img.addEventListener("load", (e) => {
      const { width, height } = e.currentTarget;
      if (width && height) {
        let state = this.state;
        state.data.StageData.width = width;
        state.data.StageData.height = height;
        this.setState();
        this.props.alert.show("تم تغيير الصورة", {
          timeout: 5 * 2000,
          type: "success",
        });
        return true;
      }
    });
  };

  handleStageClick = (e) => {
    let state = this.state;
    state.selectedShapeName = e.target.name();
    this.setState(state);
  };

  render() {
    let state = this.state;
    let { data } = state;
    let { TextData } = data;
    let memberCount = 1000;
    const discordTag = "ZAMPX#9999";
    const [name, tag] = discordTag.split("#");

    const AvatarImg = () => {
      const { AvatarData } = this.state.data;
      const image = this.state.image;
      const diameter = this.state.data.AvatarData.width || 128;
      return (
        <KonvaImage
          name="Avatar"
          draggable
          image={image}
          fillPatternImage={image}
          fillPatternOffset={{
            x: this.state.data.AvatarData.circle
              ? (image
                ? image.width
                : this.state.data.AvatarData.width || 128) / 2
              : this.state.data.AvatarData.width,
            y: this.state.data.AvatarData.circle
              ? (image
                ? image.height
                : this.state.data.AvatarData.height || 128) / 2
              : this.state.data.AvatarData.height,
          }}
          radius={diameter / 2}
          x={this.state.data.AvatarData.x}
          y={this.state.data.AvatarData.y}
          offset={{
            x: parseInt(this.state.data.AvatarData.width) / 2,
            y: parseInt(this.state.data.AvatarData.height) / 2,
          }}
          width={this.state.data.AvatarData.width || 128}
          height={this.state.data.AvatarData.height || 128}
          scaleX={this.state.data.AvatarData.scaleX}
          scaleY={this.state.data.AvatarData.scaleY}
          rotation={this.state.data.AvatarData.rotation}
          cornerRadius={this.state.data.AvatarData.cornerRadius}
          onDragEnd={(e) => {
            const { x, y } = e.target.attrs;
            Object.keys({ x, y }).forEach((key) => {
              const avatarData = {
                x,
                y,
              };
              AvatarData[key] = avatarData[key];
            });
            this.setState(state.data);
          }}
          onTransformEnd={(e) => {
            const { x, y, rotation, scaleX, scaleY } = e.target.attrs;
            Object.keys({
              x,
              y,
              scaleX,
              scaleY,
              rotation,
            }).forEach((key) => {
              const avatarData = {
                x,
                y,
                scaleX,
                scaleY,
                rotation,
              };
              AvatarData[key] = avatarData[key];
            });
            this.setState(state.data);
          }}
        />
      );
    };


    const queryParams = new URLSearchParams(window.location.search);
    let paramsObj = {};
    for (let param of queryParams) {
      paramsObj[param[0]] = param[1];
    }

    return (
      this.state.ask ? <>
        <div
          className="modal show"
          style={{ display: 'block', position: 'initial' }}
        >
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Title>يرجى إضافة رابط ويب هوك</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{ color: "red" }}>“جميع المعلومات تُحفظ محليًا”</p>
              <input
                value={this.state.webhookUrl}
                onChange={(e) => {
                  if (!e.target.value || e.target.value.length < 0)
                    return state.webhookUrl = null;
                  state.webhookUrl = e.target.value;
                  this.setState(state);
                  e.target.style.color = "";
                }}
                type="text"
                className="form-control"
                placeholder="رابط الويب هوك"
              />
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary"
                onClick={() => {
                  this.setState({ ask: !this.state.ask });
                }}
              >Close</Button>
              <Button variant="primary"
                onClick={() => {
                  axios.get(this.state.webhookUrl).then(({ data }) => {
                    this.setState({ webhookUrl: data.url });
                    this.setState({ ask: !this.state.ask });
                  }).catch(e => {
                    console.error(e);
                    this.props.alert.show("رابط غير صحيح", {
                      timeout: 5 * 1000,
                      type: "error",
                    });
                  })
                }}
              >Save</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </div>
      </> :
        <Card>
          <div className="input-group mb-3">
            <textarea
              maxLength={2000}
              value={this.state.DiscordMsg}
              onChange={(e) => {
                state.DiscordMsg = e.target.value;
                this.setState(state);
                if (!e.target.value || e.target.value.length < 0)
                  return (e.target.style.color = "RED");
                e.target.style.color = "";
              }}
              type="text"
              className="form-control  DisocrdMsg"
              placeholder="رسالة نصية للترحيب"
            />
            <Button variant="primary" onClick={this.handleSendImage}>Send</Button>
          </div>
          {this.state.uploading ? (
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Uploading...</span>
            </Spinner>
          ) : (
            <div style={{ display: 'flex' }}>
              <ColorPicker value={this.state.color} onChange={(color) => this.setState({ color })} style={{ margin: "10px" }} />
              <div dir="rtl" className="pt-25" align="center" width={window.innerWidth} height={window.innerHeight}>
                <Stage
                  onClick={this.handleStageClick}
                  width={this.state.data.StageData.width}
                  height={this.state.data.StageData.height}
                  ref={this.stageRef}
                  crossOrigin="anonymous"
                >
                  <Layer>
                    <BackgroundImage data={this.state.data.StageData} />
                    <AvatarImg />
                    {(() => {
                      const queryParams = new URLSearchParams(window.location.search);
                      let paramsObj = {};
                      for (let param of queryParams) {
                        paramsObj[param[0]] = param[1];
                      }
                      if (this.state.gradientType.startsWith('radial')) return <Text
                        name="text"
                        draggable
                        text={TextData.text
                          .replace("{{discordTag}}", paramsObj.discordTag || discordTag)
                          .replace("{{name}}", paramsObj.name || name)
                          .replace("{{tag}}", paramsObj.tag || tag)
                          .replace("{{memberCount}}", paramsObj.memberCount || memberCount)}
                        x={TextData.x}
                        y={TextData.y}
                        fontSize={TextData.fontSize}
                        scaleX={TextData.scaleX}
                        scaleY={TextData.scaleY}
                        fillRadialGradientEndRadius={0}
                        fillRadialGradientStartRadius={(this.state.textHeight + this.state.textWidth) / 2}
                        fillRadialGradientStartPoint={{ x: this.state.textWidth / 2, y: this.state.textHeight / 2 }}
                        fillRadialGradientEndPoint={{ x: this.state.textWidth / 2, y: this.state.textHeight / 2 }}
                        fillRadialGradientColorStops={this.state.colorStops}
                        fontFamily={this.state.font}
                        align={this.state.align}
                        onload={(e) => {
                          const { textHeight, textWidth } = e.target;
                          this.setState({ textHeight, textWidth });
                        }}
                        onDragEnd={(e) => {
                          const { textHeight, textWidth } = e.target;
                          this.setState({ textHeight, textWidth });
                          state.data.TextData.x = e.target.attrs.x;
                          state.data.TextData.y = e.target.attrs.y;
                          this.setState(state);
                        }}
                        rotation={this.state.data.TextData.rotation}
                        onTransformEnd={(e) => {
                          const { textHeight, textWidth } = e.target;
                          this.setState({ textHeight, textWidth });
                          const { x, y, scaleX, scaleY, rotation } = e.target.attrs;
                          Object.keys({ x, y, scaleX, scaleY, rotation }).forEach(
                            (key) => {
                              const textData = {
                                x,
                                y,
                                scaleX: scaleX,
                                scaleY: scaleY,
                                rotation,
                              };
                              TextData[key] = textData[key];
                            }
                          );
                          this.setState(state.data);
                        }}
                      />
                      else if (this.state.gradientType.startsWith('linear')) {

                        // Specify angle in degrees
                        var angleInDegrees = this.state.gradientTypeDegre || 90;

                        // Convert angle in degrees to angle in radians
                        var angleInRadians = (angleInDegrees - 90) * Math.PI / 180;

                        const { textWidth, textHeight } = this.state;

                        // Calculate gradient start and end points
                        var startX = textWidth / 2 * (1 - Math.cos(angleInRadians));  // Start at the edge of the text
                        var startY = textHeight / 2 * (1 - Math.sin(angleInRadians));
                        var endX = textWidth / 2 * (1 + Math.cos(angleInRadians));  // End at the opposite edge of the text
                        var endY = textHeight / 2 * (1 + Math.sin(angleInRadians));

                        return <Text
                          name="text"
                          draggable
                          text={TextData.text
                            .replace("{{discordTag}}", paramsObj.discordTag || discordTag)
                            .replace("{{name}}", paramsObj.name || name)
                            .replace("{{tag}}", paramsObj.tag || tag)
                            .replace("{{memberCount}}", paramsObj.memberCount || memberCount)}
                          x={TextData.x}
                          y={TextData.y}
                          fontSize={TextData.fontSize}
                          scaleX={TextData.scaleX}
                          scaleY={TextData.scaleY}
                          fillLinearGradientStartPoint={{ x: startX, y: startY }}
                          fillLinearGradientEndPoint={{ x: endX, y: endY }}
                          fillLinearGradientColorStops={this.state.colorStops}
                          fontFamily={this.state.font}
                          align={this.state.align}
                          onDragEnd={(e) => {
                            const { textHeight, textWidth } = e.target;
                            this.setState({ textHeight, textWidth });
                            state.data.TextData.x = e.target.attrs.x;
                            state.data.TextData.y = e.target.attrs.y;
                            this.setState(state);
                          }}
                          rotation={this.state.data.TextData.rotation}
                          onTransformEnd={(e) => {
                            const { textHeight, textWidth } = e.target;
                            this.setState({ textHeight, textWidth });
                            const { x, y, scaleX, scaleY, rotation } = e.target.attrs;
                            Object.keys({ x, y, scaleX, scaleY, rotation }).forEach(
                              (key) => {
                                const textData = {
                                  x,
                                  y,
                                  scaleX: scaleX,
                                  scaleY: scaleY,
                                  rotation,
                                };
                                TextData[key] = textData[key];
                              }
                            );
                            this.setState(state.data);
                          }}
                        />
                      } else if (this.state.gradientType.startsWith('solid')) return <Text
                        name="text"
                        draggable
                        text={TextData.text
                          .replace("{{discordTag}}", paramsObj.discordTag || discordTag)
                          .replace("{{name}}", paramsObj.name || name)
                          .replace("{{tag}}", paramsObj.tag || tag)
                          .replace("{{memberCount}}", paramsObj.memberCount || memberCount)}
                        x={TextData.x}
                        y={TextData.y}
                        fontSize={TextData.fontSize}
                        scaleX={TextData.scaleX}
                        scaleY={TextData.scaleY}
                        fillRadialGradientEndRadius={0}
                        fillRadialGradientStartRadius={(this.state.textHeight + this.state.textWidth) / 2}
                        fillRadialGradientStartPoint={{ x: this.state.textWidth / 2, y: this.state.textHeight / 2 }}
                        fillRadialGradientEndPoint={{ x: this.state.textWidth / 2, y: this.state.textHeight / 2 }}
                        fillRadialGradientColorStops={this.state.colorStops}
                        fontFamily={this.state.font}
                        align={this.state.align}
                        onDragEnd={(e) => {
                          const { textHeight, textWidth } = e.target;
                          this.setState({ textHeight, textWidth });
                          state.data.TextData.x = e.target.attrs.x;
                          state.data.TextData.y = e.target.attrs.y;
                          this.setState(state);
                        }}
                        rotation={this.state.data.TextData.rotation}
                        onTransformEnd={(e) => {
                          const { textHeight, textWidth } = e.target;
                          this.setState({ textHeight, textWidth });
                          const { x, y, scaleX, scaleY, rotation } = e.target.attrs;
                          Object.keys({ x, y, scaleX, scaleY, rotation }).forEach(
                            (key) => {
                              const textData = {
                                x,
                                y,
                                scaleX: scaleX,
                                scaleY: scaleY,
                                rotation,
                              };
                              TextData[key] = textData[key];
                            }
                          );
                          this.setState(state.data);
                        }}
                      />
                    })()}
                    <TransformerComponent
                      selectedShapeName={this.state.selectedShapeName}
                    />
                  </Layer>
                </Stage>
                {paramsObj.image ? <img alt="Konva stage" src={this.stageRef.current ? this.stageRef.current.toDataURL() : null} /> : null}
              </div>
              <Button
                variant="primary"
                onClick={this.handleDownloadImage}
                style={{ height: this.state.data.StageData.height }}
              >Download Image</Button>
            </div>)}
          <div className="my-3">
            <label htmlFor="backgroundImg" className="form-label">
              رفع صورة خلفية من جهازك الشخصي
            </label>
            <input
              className="form-control"
              type="file"
              id="backgroundImg"
              accept="image/png, image/jpeg"
              style={{
                color: "WHITE",
              }}
              onChange={(e) => {
                this.setState({ uploading: true }); // Set uploading to true when the upload starts
                const image = e.target.files[0];
                const fileTypes = [
                  "image/apng",
                  "image/bmp",
                  "image/gif",
                  "image/jpeg",
                  "image/pjpeg",
                  "image/png",
                  "image/svg+xml",
                  "image/tiff",
                  "image/webp",
                  "image/x-icon",
                ];
                if (fileTypes.includes(image.type)) {
                  const formData = new FormData();
                  formData.append('file', image);
                  axios.post(serverHost + '/upload', formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data'
                    }
                  }).then(response => {
                    this.setState({ uploading: false }); // Set uploading to false when the upload finishes
                    state.data.StageData.background = serverHost + '/' + response.data.filePath;
                    this.setState(state);
                    this.getImageSize(state.data.StageData.background).then((sized) => {
                      if (!sized) e.target.style.color = "WHITE";
                      else e.target.style.color = "RED";
                    });
                  }).catch(error => {
                    console.error(error);
                    this.props.alert.show("حدث خطأ ما", {
                      timeout: 5 * 2000,
                      type: "error",
                    });
                  });
                } else {
                  e.target.style.color = "RED";
                  this.props.alert.show("حدث خطأ ما", {
                    timeout: 5 * 2000,
                    type: "error",
                  });
                }
              }}
            />
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.StageData.background}
              style={{ color: "WHITE" }}
              onChange={(e) => {
                if (!e.target.value || e.target.value.length < 0)
                  return (e.target.style.color = "RED");
                state.data.StageData.background = e.target.value;
                this.setState(state);
                this.getImageSize(e.target.value).then((sized) => {
                  if (!sized) e.target.style.color = "WHITE";
                  else e.target.style.color = "RED";
                });
              }}
              type="text"
              className="form-control"
              placeholder="رابط صورة الخلفية"
            />
            <span className="input-group-text" id="basic-addon2">
              "رابط صورة الخلفية"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.AvatarData.x}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.AvatarData.x = value || state.data.AvatarData.x;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="البعد الأفقي لصورة العضو"
            />
            <span className="input-group-text" id="basic-addon2">
              "البعد الأفقي لصورة العضو"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.AvatarData.y}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.AvatarData.y = value || state.data.AvatarData.y;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="البعد الرئسي لصورة العضو"
            />
            <span className="input-group-text" id="basic-addon2">
              "البعد الرئسي لصورة العضو"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.AvatarData.scaleX}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.AvatarData.scaleX =
                  value || state.data.AvatarData.scaleX;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="عرض لصورة العضو"
            />
            <span className="input-group-text" id="basic-addon2">
              "عرض صورة العضو"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.AvatarData.scaleY}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.AvatarData.scaleY =
                  value || state.data.AvatarData.scaleY;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="طول لصورة العضو"
            />
            <span className="input-group-text" id="basic-addon2">
              "طول صورة العضو"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.AvatarData.rotation}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.AvatarData.rotation =
                  value || state.data.AvatarData.rotation;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="محور لصورة العضو"
            />
            <span className="input-group-text" id="basic-addon2">
              "محور صورة العضو"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.AvatarData.cornerRadius}
              onChange={(e) => {
                if (e.target.value > 90) e.target.value = 90;
                const value = parseInt(e.target.value);
                state.data.AvatarData.cornerRadius =
                  value || state.data.AvatarData.cornerRadius;
                if (state.data.AvatarData.cornerRadius !== 90) state.data.AvatarData.circle = false;
                else state.data.AvatarData.circle = true;
                this.setState(state);
              }}
              type="number"
              min={0}
              max={90}
              className="form-control"
              placeholder="أطراف لصورة العضو"
            />
            <span className="input-group-text" id="basic-addon2">
              <Form>
                <Form.Check
                  label=" "
                  type="switch"
                  id="circleSwitch"
                  checked={this.state.data.AvatarData.circle}
                  onChange={(e) => {
                    state.data.AvatarData.circle = e.target.checked;
                    if (state.data.AvatarData.circle) state.data.AvatarData.cornerRadius = 90;
                    else state.data.AvatarData.cornerRadius = 0;
                    this.setState(state);
                  }}
                />
              </Form>
              "أطراف صورة العضو"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.TextData.x}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.TextData.x = value || state.data.TextData.x;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="البعد الأفقى لنص الترحيب"
            />
            <span className="input-group-text" id="basic-addon2">
              "البعد الأفقى لنص الترحيب"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.TextData.y}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.TextData.y = value || state.data.TextData.y;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="البعد الرئسي لنص الترحيب"
            />
            <span className="input-group-text" id="basic-addon2">
              "البعد الرئسي لنص الترحيب"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.TextData.scaleX}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.TextData.scaleX = value || state.data.TextData.scaleX;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="عرض نص الترحيب"
            />
            <span className="input-group-text" id="basic-addon2">
              "عرض نص الترحيب"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.TextData.scaleY}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.TextData.scaleY = value || state.data.TextData.scaleY;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="طول نص الترحيب"
            />
            <span className="input-group-text" id="basic-addon2">
              "طول نص الترحيب"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.TextData.fontSize}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.TextData.fontSize =
                  value || state.data.TextData.fontSize;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="حجم نص الترحيب"
            />
            <span className="input-group-text" id="basic-addon2">
              <input
                type="file"
                accept=".woff,.ttf,.otf"
                onChange={this.handleFontUpload}
              />
              "حجم نص الترحيب"
            </span>
          </div>
          <div className="input-group mb-3">
            <input
              value={this.state.data.TextData.rotation}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                state.data.TextData.rotation =
                  value || state.data.TextData.rotation;
                this.setState(state);
              }}
              type="number"
              className="form-control"
              placeholder="محور نص الترحيب"
            />
            <span className="input-group-text" id="basic-addon2">
              "محور نص الترحيب"
            </span>
          </div>
          <div className="form-group mb-3">
            <div className="input-group">
              <textarea
                value={this.state.data.TextData.text}
                onChange={async (e) => {
                  state.data.TextData.text = e.target.value;
                  this.setState(state);
                }}
                type="text"
                className="form-control"
                placeholder="نص الترحيب"
                aria-describedby="welcomeTextHelp"
                id="welcomeTextHelp"
              />
              <span className="input-group-text" id="basic-addon2">
                <Dropdown style={{ marginRight: "10px" }}>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    محاذاة
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => {
                      this.setState({ align: "left" });
                    }}>يسار</Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      this.setState({ align: "right" });
                    }}>يمين</Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      this.setState({ align: "center" });
                    }}>وسط</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                "نص الترحيب"
              </span>
            </div>
            <small id="welcomeTextHelp" className="form-text text-muted">
              {welcomeTextHint}
            </small>
          </div>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const dataJson = this.state;
                const response = await axios.post(serverHost + '/stateSave', dataJson); // Add dataJson as the second parameter to the post request
                if (response.data.error) { // Check if the response has an error property
                  this.props.alert.show("حدث خطأ ما", {
                    timeout: 5 * 2000,
                    type: "error",
                  });
                  throw new Error(response.data.error); // If there's an error, throw it
                }
                localStorage.setItem("state", JSON.stringify(dataJson));
                this.props.alert.show("تم الحفظ", {
                  timeout: 5 * 2000,
                  type: "success",
                });
              } catch (err) {
                this.props.alert.show("حدث خطأ ما", {
                  timeout: 5 * 2000,
                  type: "error",
                });
              }
            }}
          >
            حفظ.
          </Button>
        </Card>
    );
  }
}
