import { createFileRoute, Link } from "@tanstack/react-router";
import headshot from "@/assets/headshot.webp";
import logoReadySet from "@/assets/logo-readyset.jpg";
import logoHomeDepot from "@/assets/logo-home-depot.png";
import logoAkron from "@/assets/logo-akron.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Robert Britton" },
      { name: "description", content: "About Robert Britton: marketing & revenue enablement professional, University of Akron BBA graduate." },
      { property: "og:title", content: "About — Robert Britton" },
      { property: "og:description", content: "Marketing & Revenue Enablement at ReadySet Surgical. University of Akron BBA, Marketing." },
    ],
  }),
  component: About,
});

type Role = {
  title: string;
  dates: string;
  bullets?: string[];
  note?: string;
};

type Job = {
  company: string;
  logo: string;
  meta: string;
  roles: Role[];
};

const jobs: Job[] = [
  {
    company: "ReadySet Surgical",
    logo: logoReadySet,
    meta: "Full-time · 3 yrs 1 mo · Cleveland, Ohio · Hybrid",
    roles: [
      {
        title: "Manager, Marketing & Revenue Enablement",
        dates: "Jan 2025 – Present · 1 yr 5 mos",
        bullets: [
          "Develop and execute multi-channel demand generation programs driving measurable pipeline contribution across virtual and in-person channels.",
          "Architect the company CRM, building infrastructure across marketing, sales, service, and finance to enable precision go-to-market targeting and analytics.",
          "Incorporate sales and marketing process improvements and SOPs, reducing friction in daily operations and improving go-to-market speed and consistency.",
          "Create sales enablement materials, battlecards, and competitive positioning resources equipping the sales team with the knowledge needed to win and informing broader company strategy.",
        ],
        note: "Also continue most responsibilities from earlier roles. Skills: Salesforce.com Administration, Data Analysis, +1.",
      },
      {
        title: "Marketing Coordinator",
        dates: "Jun 2024 – Jan 2025 · 8 mos",
        bullets: [
          "Continued responsibilities of the intern role in a full-time capacity.",
          "Responsible for creating, scheduling, and synchronizing content and messaging across all channels.",
          "Acted as the de-facto webmaster.",
        ],
      },
      {
        title: "Marketing Intern",
        dates: "May 2023 – Jun 2024 · 1 yr 2 mos",
        bullets: [
          "Led marketing team in WordPress website redesign and SEO strategy, achieving 80% reduction in total load time and first-page Google rank for target industry keywords.",
          "Created original blog and social content for official company channels and distributed to LinkedIn audience.",
          "Created persona-specific email drip campaigns to facilitate pre-show outreach.",
          "Analyzed web traffic using Google Analytics 4, Google Search Console, and Bing Webmaster Tools to refine digital marketing messaging and strategy.",
          "Conducted industry analysis using market research databases to create sales battle cards.",
        ],
      },
    ],
  },
  {
    company: "The Home Depot",
    logo: logoHomeDepot,
    meta: "Part-time · 2 yrs 1 mo · Strongsville, Ohio",
    roles: [
      {
        title: "Appliances Salesperson",
        dates: "May 2021 – May 2023 · 2 yrs 1 mo",
        bullets: [
          "Appliance specialist facilitating sales of all home appliances: refrigerators, dishwashers, ranges, microwaves (OTR & countertop), wall ovens, cooktops, washers, and dryers.",
          "May–Aug 2022: ~$210k in net sales working a maximum of 30 hours per week.",
          "Finished First Half as #3 ranked appliance specialist in district (West Cleveland), measured by sales volume, credit card applications, and leads.",
          "Received two separate awards from store leadership for performance.",
        ],
      },
    ],
  },
];

function About() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden text-foreground">
      <div className="xmb-bg" />
      <div className="xmb-wave" />
      <div className="xmb-ribbon" style={{ top: "30%" }} />
      <div className="xmb-ribbon" style={{ top: "55%", opacity: 0.3 }} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-10 sm:px-10 sm:py-16">
        <nav className="mb-8 text-xs uppercase tracking-[0.2em] opacity-70 xmb-text-glow">
          <Link to="/" className="hover:opacity-100">‹ back to home</Link>
        </nav>

        <header className="mb-12 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-left">
          <img
            src={headshot}
            alt="Robert Britton headshot"
            className="h-36 w-36 rounded-full object-cover shadow-xl ring-2 ring-white/30 sm:h-44 sm:w-44"
          />
          <div className="xmb-text-glow">
            <h1 className="text-3xl font-light tracking-wide sm:text-5xl">Robert Britton</h1>
            <p className="mt-2 text-sm font-light opacity-80 sm:text-base">
              Manager, Marketing &amp; Revenue Enablement · Cleveland, Ohio
            </p>
            <a
              href="https://www.linkedin.com/in/robertjbritton/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs uppercase tracking-[0.2em] underline-offset-4 opacity-80 hover:underline"
            >
              LinkedIn ↗
            </a>
          </div>
        </header>

        <section className="mb-12">
          <h2 className="mb-4 text-xs uppercase tracking-[0.25em] opacity-70 xmb-text-glow">Education</h2>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-sm xmb-text-glow">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-light sm:text-xl">The University of Akron</h3>
              <span className="shrink-0 text-xs opacity-70">Aug 2020 – May 2024</span>
            </div>
            <p className="mt-1 text-sm opacity-90">
              Bachelor of Business Administration (BBA), Marketing · Minor: Entrepreneurship · CGPA 3.95
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm opacity-85">
              <li>American Marketing Association, University of Akron Chapter</li>
              <li>
                Beta Gamma Sigma Honors Society — Top 10% of class after 75% of core curriculum
                (Spring 2022 inductee)
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xs uppercase tracking-[0.25em] opacity-70 xmb-text-glow">Experience</h2>
          <div className="space-y-6">
            {jobs.map((job) => (
              <article
                key={job.company}
                className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-sm xmb-text-glow"
              >
                <div className="mb-4 flex items-center gap-4">
                  <img
                    src={job.logo}
                    alt={`${job.company} logo`}
                    className="h-12 w-12 shrink-0 rounded object-contain bg-white/90 p-1"
                  />
                  <div>
                    <h3 className="text-lg font-light sm:text-xl">{job.company}</h3>
                    <p className="text-xs opacity-70">{job.meta}</p>
                  </div>
                </div>

                <div className="space-y-5 border-l border-white/15 pl-5">
                  {job.roles.map((role) => (
                    <div key={role.title}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <h4 className="text-base font-light sm:text-lg">{role.title}</h4>
                        <span className="text-xs opacity-70">{role.dates}</span>
                      </div>
                      {role.bullets && (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-90">
                          {role.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                      {role.note && (
                        <p className="mt-2 text-xs italic opacity-75">{role.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
