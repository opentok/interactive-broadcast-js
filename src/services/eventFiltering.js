// @flow
import R from 'ramda';

type FilterInput = {
  status: EventStatus,
  archiveId: string
};

const statusFilter = (filter: EventFilter): (FilterInput => boolean) => ({ status, archiveId = '' }: FilterInput): boolean => {
  switch (filter) {
    case 'all':
      return true;
    case 'current':
      return status !== 'closed';
    case 'archived':
      return status === 'closed' && !!archiveId.length;
    default:
      return true;
  }
};

type Comparator = (a: BroadcastEvent, b: BroadcastEvent) => number;
const comparator = (sorting: EventSorting): Comparator => {

  const operator = sorting.order === 'descending' ? 'gt' : 'lt';
  const sortByTypeToProp: {[type: EventSortByOption]: string} = {
    mostRecent: 'updatedAt',
    startDate: 'dateTimeStart',
    state: 'status',
  };

  const sortingProp = R.prop(sortByTypeToProp[sorting.sortBy]);
  return R.comparator((a: BroadcastEvent, b: BroadcastEvent): number => R[operator](sortingProp(a), sortingProp(b)));
};

const filterAndSort = ({ map, filter, sorting }: EventsState): BroadcastEvent[] =>
  R.compose(
    R.sort(comparator(sorting)),
    R.filter(statusFilter(filter)),
  )(R.values(map));

module.exports = {
  filterAndSort,
};
