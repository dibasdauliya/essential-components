import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import React from 'react';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primarry', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} | ${siteConfig.tagline}`}
      description="Web Components made easy">
      <HomepageHeader />

      <main>
      <section className={styles.features}>
      <div className="container" style={{padding:'2em'}}>
          <div className="row">
            <div className="col col--4">
              <h2>What is Essential Components?</h2>
              <p>Essential Components is a collection of framework-agnostic web components designed for easy integration and customization.</p>
            </div>
            <div className="col col--4">
              <h2>Why Essential Components?</h2>
              <p>They are simple, lightweight, and reusable, enhancing your web development experience with minimal effort.</p>
            </div>
            <div className="col col--4">
              <h2>How to get started?</h2>
              <p>Install via npm and start using the components in your project. Comprehensive <a href="/docs/intro">documentation</a> is available for guidance.</p>
            </div>
          </div>
        </div>
      </section>
      </main>
    </Layout>
  );
}
