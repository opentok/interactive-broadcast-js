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
      return !!archiveId.length;
    default:
      return true;
  }
};

// const comparator = (sorting: EventSorting): boolean => {
//   return sorting.sortBy === 'mostRecent';
// }


const filterAndSort = ({ list, filter, sorting }: EventsState): BroadcastEvent[] => {



  // const comparator = (a: BroadcastEvent, b: BroadcastEvent): Int => a.showStarted - b.showStarted;

  // return R.compose(
  //   R.sort(comparator),
  //   R.filter(statusFilter)
  // )(list);

  return R.filter(statusFilter(filter))(list);
};


module.exports = {
  filterAndSort,
};
