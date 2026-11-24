function AboutOrganigo() {
  return (
    <section className="about-organigo-page">

      {/* HEADER */}
      <div className="about-organigo-header">
        <div className="about-organigo-logo">🌿</div>

        <h1>ORGANIGO</h1>

        <p>Freshness Delivered to Your Doorstep.</p>

        <span className="about-version-badge">
          Version 1.0.0
        </span>
      </div>

      {/* ABOUT */}
      <div className="about-organigo-card">
        <h2>About ORGANIGO</h2>

        <p>
          ORGANIGO is an online grocery delivery platform designed
          to make everyday shopping simple and convenient.
        </p>

        <p>
          Our goal is to connect customers with fresh fruits,
          vegetables and daily essentials through a reliable
          delivery experience.
        </p>
      </div>

      {/* APP INFORMATION */}
      <div className="about-organigo-card">
        <h2>Application Information</h2>

        <div className="about-info-row">
          <span>Application Name</span>
          <strong>ORGANIGO</strong>
        </div>

        <div className="about-info-row">
          <span>App Version</span>
          <strong>1.0.0</strong>
        </div>

        <div className="about-info-row">
          <span>Platform</span>
          <strong>Web Application</strong>
        </div>

        <div className="about-info-row">
          <span>Location</span>
          <strong>Chaibasa, Jharkhand</strong>
        </div>
      </div>

      {/* LEGAL */}
      <div className="about-organigo-card">
        <h2>Legal & Information</h2>

        <div className="about-link-row">
          <div>
            <strong>Terms of Service</strong>
            <p>Rules and conditions for using ORGANIGO.</p>
          </div>
          <span>›</span>
        </div>

        <div className="about-link-row">
          <div>
            <strong>Privacy Policy</strong>
            <p>How customer information is handled.</p>
          </div>
          <span>›</span>
        </div>

        <div className="about-link-row">
          <div>
            <strong>Licenses & Registrations</strong>
            <p>Business and platform registration information.</p>
          </div>
          <span>›</span>
        </div>

        <div className="about-link-row">
          <div>
            <strong>Open Source Libraries</strong>
            <p>Technologies and libraries used in ORGANIGO.</p>
          </div>
          <span>›</span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="about-organigo-footer">
        <p>Made with ❤️ for ORGANIGO</p>
        <small>© {new Date().getFullYear()} ORGANIGO. All rights reserved.</small>
      </div>

    </section>
  );
}

export default AboutOrganigo;