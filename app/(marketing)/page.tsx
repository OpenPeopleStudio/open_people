import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { TrackRows } from "@/components/marketing/board/EntryBlock";
import { SourceLinks } from "@/components/marketing/desk";
import {
  HOME_CAMPUS_CANONICAL,
  HOME_CHURCHILL,
  HOME_COMPANY_CLOSE,
  HOME_CONSENT,
  HOME_DESCRIPTION,
  HOME_HEADLINE_CAMPUS,
  HOME_HEADLINE_COMPANY,
  HOME_ISED_CRITERIA,
  HOME_LEDE_CAMPUS,
  HOME_LEDE_COMPANY,
  HOME_OTTAWA_CALL,
  HOME_OTTAWA_HEADING,
  HOME_OTTAWA_STRATEGY,
  HOME_POWER_CONTEXT,
  HOME_POWER_LINE,
  HOME_RESEARCH,
  HOME_STATUS,
} from "@/lib/marketing/home";
import { sourceList } from "@/lib/desk";
import { deskMetadata } from "@/lib/og/metadata";

/** Search title only. The on-page heading stays the company line. */
const HOME_SEARCH_TITLE = "Churchill Falls power — Open People";

export const metadata = deskMetadata({
  title: { absolute: HOME_SEARCH_TITLE },
  description: HOME_DESCRIPTION,
  path: "/",
});

const OTTAWA_SOURCES = sourceList([
  "isedDataCentreCall",
  "isedDataCentreIntake",
  "isedComputeStrategy",
]);

export default function HomePage() {
  return (
    <DeskPage
      kicker="Open People"
      title={
        <>
          {HOME_HEADLINE_COMPANY}
          <span className="home-h1-next">{HOME_HEADLINE_CAMPUS}</span>
        </>
      }
      lede={
        <>
          <p>{HOME_LEDE_COMPANY}</p>
          <p className="mt-4">{HOME_LEDE_CAMPUS}</p>
        </>
      }
      actions={
        <>
          <Link href="/about" className="btn-secondary">
            About the company
          </Link>
          <Link href="#campus" className="btn-primary">
            The campus
          </Link>
        </>
      }
      verified={false}
      sections={[
        { id: "company", label: "Company" },
        { id: "campus", label: "Campus" },
        { id: "ottawa", label: "Ottawa" },
        { id: "power", label: "Power" },
        { id: "board", label: "The board" },
      ]}
    >
      <DeskSection id="company" num="01 — The company" title="Open People.">
        <p className="desk-body">{HOME_LEDE_COMPANY}</p>
        <p className="desk-body mt-5">{HOME_RESEARCH}</p>
        <p className="desk-body mt-5">{HOME_COMPANY_CLOSE}</p>
        <p className="mt-6">
          <Link href="/about" className="desk-link">
            About Open People
          </Link>
        </p>
      </DeskSection>

      <DeskSection id="campus" num="02 — The campus" title="Proposed. In feasibility.">
        <p className="desk-body">{HOME_POWER_CONTEXT}</p>
        <p className="desk-body mt-5">{HOME_CAMPUS_CANONICAL}</p>
        <p className="desk-body mt-5">{HOME_POWER_LINE}</p>
        <p className="desk-body mt-5">{HOME_CONSENT}</p>
        <p className="desk-body mt-5">{HOME_STATUS}</p>
        <p className="mt-6 flex flex-wrap gap-5">
          <Link href="/build" className="desk-link">
            Build track
          </Link>
          <Link href="/compute" className="desk-link">
            Compute plan
          </Link>
        </p>
      </DeskSection>

      <DeskSection id="ottawa" num="03 — Ottawa" title={HOME_OTTAWA_HEADING}>
        <p className="desk-body">{HOME_OTTAWA_CALL}</p>
        <p className="desk-body mt-5">{HOME_ISED_CRITERIA}</p>
        <p className="desk-body mt-5">{HOME_OTTAWA_STRATEGY}</p>
        <SourceLinks sources={OTTAWA_SOURCES} />
      </DeskSection>

      <DeskSection id="power" num="04 — Power around the campus" title="Churchill Falls is context.">
        <p className="desk-body">{HOME_CHURCHILL}</p>
        <p className="mt-6 flex flex-wrap gap-5">
          <Link href="/power" className="desk-link">
            Power track
          </Link>
          <Link href="/brief" className="desk-link">
            Brief
          </Link>
          <Link href="/tracker" className="desk-link">
            Tracker
          </Link>
        </p>
      </DeskSection>

      <DeskSection id="board" num="05 — The board" title="Four tracks. One project." wide>
        <TrackRows />
      </DeskSection>
    </DeskPage>
  );
}
