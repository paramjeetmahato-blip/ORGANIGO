import { useNavigate } from "react-router-dom";
import "../styles/About.css";

function About() {
  const navigate = useNavigate();

  const aboutItems = [
    {
      title: "Terms of Service",
      path: "/about/terms",
    },
    {
      title: "Privacy Policy",
      path: "/about/privacy",
    },
    {
      title: "Refund & Cancellation Policy",
      path: "/about/refund",
    },
    {
      title: "Open Source Libraries",
      path: "/about/open-source",
    },
    {
      title: "Licenses and Registrations",
      path: "/about/licenses",
    },
    {
      title: "Contact Us",
      path: "/about/contact",
    },
  ];

  return (
    <div className="about-page">

      <div className="about-header">

        <button
          className="about-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h1>About</h1>

      </div>

      <div className="about-content">

        {aboutItems.map((item, index) => (
          <button
            className="about-item"
            key={index}
            onClick={() => navigate(item.path)}
          >
            <span>{item.title}</span>
            <span className="about-arrow">›</span>
          </button>
        ))}

        <div className="about-version">

          <div>App version</div>

          <p>v1.0.0 Live</p>

        </div>

        <div className="about-copyright">

          <h3>ORGANIGO</h3>

          <p>
            Freshness Delivered to Your Doorstep.
          </p>

          <small>
            © 2026 ORGANIGO. All Rights Reserved.
          </small>

        </div>

      </div>

    </div>
  );
}

export default About;