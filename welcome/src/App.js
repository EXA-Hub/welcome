import React, { useState, useEffect } from "react";
import "./App.css";
import MainPage from "./components/MainPage/MainPage";
import { Container, Row, Col, Spinner, Button, Modal } from 'react-bootstrap';
import { FaShieldAlt } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.toString() };
  }

  componentDidCatch(error, info) {
    // You can still log the error details to the console for debugging
    console.log(error, info);
  }

  render() {
    if (this.state.hasError) {
      // Render any custom fallback UI with the error message
      return <p>{this.state.errorMessage}</p>;
    }

    return this.props.children;
  }
}

function App() {
  const [isListed, setIsListed] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    let paramsObj = {};
    for (let param of queryParams) {
      paramsObj[param[0]] = param[1];
    }
    if (paramsObj.password) {
      if (paramsObj.password === "zampx") {
        setIsListed(true);
      } else setIsListed(false);
    } else setIsListed("ask");
  }, []);

  if (!isListed) {
    return (
      <Container fluid style={{ backgroundColor: '#202022', height: '100vh', color: '#CACACA' }} className="d-flex flex-column justify-content-center align-items-center">
        <Row>
          <Col md={{ span: 8, offset: 2 }} className="text-center">
            <FaShieldAlt color="#878787" size={50} />
            <h2 className="mt-3">Waiting for the security report</h2>
            <p>The backend server is checking your IP address.</p>
          </Col>
        </Row>
        <Row>
          <Col md={{ span: 8, offset: 2 }} className="text-center">
            <Spinner animation="border" role="status" />
            <div id="load">
              <div>G</div>
              <div>N</div>
              <div>I</div>
              <div>D</div>
              <div>A</div>
              <div>O</div>
              <div>L</div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  } else if (isListed === "ask") {
    return <>
      <div
        className="modal show"
        style={{ display: 'block', position: 'initial' }}
      >
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Title>يرجى إدخال كلمة المرور</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p style={{ color: "red" }}>“جميع المعلومات تُحفظ محليًا”</p>
            <input
              type="password"
              className="form-control"
              placeholder="كلمة المرور"
              id="passwordInput"
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="primary"
              onClick={() => {
                const passwordInput = document.getElementById('passwordInput');
                const password = passwordInput ? passwordInput.value : "";
                window.location.href = "/?password=" + password;
              }}
            >Save</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </div>
    </>
  } else {
    return (
      <ErrorBoundary>
        <div id="body">
          <MainPage />
        </div>
      </ErrorBoundary>
    );
  }
}

export default App;