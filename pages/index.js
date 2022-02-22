import { useMemo, useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useTable, usePagination } from "react-table";
import styled from "styled-components";
import styles from "../styles/Home.module.css";

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;
    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }
    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }

  .pagination {
    padding: 0.5rem;
  }
`;
//https://hashnode.com/post/how-to-get-the-local-time-of-a-particular-timezone-in-javascript-cj703pkwg01t9s5wt8zh37rwz
function calcTime(offset) {
  let d = new Date();

  let utc = d.getTime() + d.getTimezoneOffset() * 60000;

  let nd = new Date(utc + 3600000 * offset);

  return nd;
}

//https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export async function getStaticProps(context) {
  const countRequest = await fetch(
    "https://data.sfgov.org/api/id/jjew-r69b?$query=select%20count(*)%20as%20COLUMN_ALIAS_GUARD__count"
  );
  const countresponse = await countRequest.json();
  const count = countresponse[0].COLUMN_ALIAS_GUARD__count;

  const foodtruckInfoRequest = await fetch(
    "https://data.sfgov.org/api/id/jjew-r69b.json?$select=`starttime`,`endtime`,`dayorder`,`permit`,`location`,`optionaltext`,`scheduleid`,`start24`,`end24`,`applicant`,`latitude`,`longitude`&$order=`:id`+ASC&$limit=" +
      count +
      `&$offset=0`
  );
  const foodtruckInfoResponse = await foodtruckInfoRequest.json();

  let curSfTime = calcTime(-8);

  let dateString = new Date(`1/1/1999 ${curSfTime.getHours()}:00`);
  let curDay = curSfTime.getDay();

  let openFoodTrucks = foodtruckInfoResponse.filter((truck) => {
    return (
      dateString >= new Date(`1/1/1999 ${truck.start24}`) &&
      dateString < new Date(`1/1/1999 ${truck.end24}`) &&
      Number(curDay) === Number(truck.dayorder)
    );
  });

  return {
    props: {
      count,
      foodtrucks: openFoodTrucks,
    },
    revalidate: 3600,
  };
}

function Table({ columns, data }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 },
    },
    usePagination
  );

  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* 
        Pagination can be built however you'd like. 
        This is just a very basic UI implementation:
      */}
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {"<<"}
        </button>{" "}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {"<"}
        </button>{" "}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {">"}
        </button>{" "}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {">>"}
        </button>{" "}
        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
        <span>
          | Go to page:{" "}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: "100px" }}
          />
        </span>{" "}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export default function Home(props) {
  const [userAddress, setUserAddress] = useState(null);
  const [foodtrucks, setFoodtrucks] = useState(null);
  const [error, setError] = useState(null);
  const inputEl = useRef(null);
  //185 berry street, SF, CA
  useEffect(async () => {
    if (userAddress) {
      setError(null);
      try {
        const longlatReq = await fetch(
          `http://api.positionstack.com/v1/forward?access_key=5dba50e975d42f51934c5af3052180c9&query="${userAddress}"&limit=1`
        );
        const response = await longlatReq.json();

        if (response.data.length === 0) {
          throw new Error("invalid location");
        }

        const userLat = response.data[0].latitude;
        const userLong = response.data[0].longitude;

        const sortedFoodTrucksByDistance = props.foodtrucks.slice();
        sortedFoodTrucksByDistance.sort((a, b) => {
          return (
            getDistanceFromLatLonInKm(
              userLat,
              userLong,
              a.latitude,
              a.longitude
            ) -
            getDistanceFromLatLonInKm(
              userLat,
              userLong,
              b.latitude,
              b.longitude
            )
          );
        });
        setFoodtrucks(sortedFoodTrucksByDistance);
      } catch (e) {
        setFoodtrucks(null);
        setError("invalid input");
      }
    }
  }, [userAddress]);

  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "applicant",
      },
      {
        Header: "Description",
        accessor: "optionaltext",
      },
      {
        Header: "Location",
        accessor: "location",
      },
      {
        Header: "Opening Time",
        accessor: "starttime",
      },
      {
        Header: "Closing Time",
        accessor: "endtime",
      },
    ],
    []
  );
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div style={{ marginBottom: 20 }}>
          try to use the format "185 berry street, SF, CA" for accurate results
        </div>
        <label>
          current address:
          <input style={{ marginLeft: 10 }} type="text" ref={inputEl} />
        </label>
        <button
          style={{ marginTop: 5 }}
          onClick={() => {
            setUserAddress(inputEl.current.value);
          }}
        >
          submit
        </button>
        {error && <div>{error}</div>}
        {!error && foodtrucks && (
          <Styles>
            <Table columns={columns} data={foodtrucks} />
          </Styles>
        )}
      </main>
    </div>
  );
}
