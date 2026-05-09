import { lazy, Suspense } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthorizationError from "../../Modules/PlacementCell/components/common/AuthorizationError";
import { PLACEMENT_OFFICER_ROLES } from "../../Modules/PlacementCell/utils/authorization";
import {
  placementCellApplicationDetailRoute,
  placementCellApplyRoute,
  placementCellOfferDetailRoute,
  placementCellRoute,
  placementCellTimelineRoute,
  placementCellViewRoute,
} from ".";

const PlacementCellPage = lazy(() => import("../../Modules/PlacementCell"));
const ApplyForPlacementPage = lazy(
  () => import("../../Modules/PlacementCell/ApplyForPlacement"),
);
const PlacementEventPage = lazy(
  () => import("../../Modules/PlacementCell/PlacementEvent"),
);
const ApplicationTimelinePage = lazy(
  () => import("../../Modules/PlacementCell/ApplicationTimeline"),
);
const OfferDetailPage = lazy(
  () => import("../../Modules/PlacementCell/OfferDetail"),
);
const ApplicationDetailPage = lazy(
  () => import("../../Modules/PlacementCell/pages/ApplicationDetailPage"),
);

function PlacementOfficerRoute({ children }) {
  const role = useSelector((state) => state.user.role);

  if (!PLACEMENT_OFFICER_ROLES.includes(role)) {
    return (
      <AuthorizationError message="Only placement officer users can access applicant-management features." />
    );
  }

  return children;
}

PlacementOfficerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function PlacementCellRoutes() {
  return (
    <Suspense fallback={<div>Loading .... </div>}>
      <Routes>
        <Route index element={<PlacementCellPage />} />
        <Route
          path={placementCellApplyRoute}
          element={<ApplyForPlacementPage />}
        />
        <Route
          path={placementCellViewRoute}
          element={
            <PlacementOfficerRoute>
              <PlacementEventPage />
            </PlacementOfficerRoute>
          }
        />
        <Route
          path={placementCellTimelineRoute}
          element={<ApplicationTimelinePage />}
        />
        <Route
          path={placementCellOfferDetailRoute}
          element={<OfferDetailPage />}
        />
        <Route
          path={placementCellApplicationDetailRoute}
          element={
            <PlacementOfficerRoute>
              <ApplicationDetailPage />
            </PlacementOfficerRoute>
          }
        />
        <Route path="*" element={<Navigate to={placementCellRoute} replace />} />
      </Routes>
    </Suspense>
  );
}

export default PlacementCellRoutes;
