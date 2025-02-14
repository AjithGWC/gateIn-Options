import React, { useState, useEffect } from 'react';
import domo from "ryuu.js";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown } from '@fortawesome/free-solid-svg-icons';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 52;

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    setLoading(true);
  
    try {
      // Fetch all the data (no ordering in SQL query)
      const response = await domo.get('/data/v1/dataset');
      console.log("response", response);
  
      // Use the data directly since it is already in key-value format
      const data = response; // Assuming response is an array of objects as shown
  
      // Custom sorting function for 'Division' field
      const customSort = (a, b) => {
        const divisionPriority = {
          MENS: 1,
          WOMENS: 2,
          KIDS: 3,
        };
  
        const divisionA = a["division"].toUpperCase();
        const divisionB = b["division"].toUpperCase();
  
        if (divisionA.startsWith("MENS") && !divisionB.startsWith("MENS")) return -1;
        if (divisionB.startsWith("MENS") && !divisionA.startsWith("MENS")) return 1;
  
        if (divisionA.startsWith("WOMENS") && !divisionB.startsWith("WOMENS")) return -1;
        if (divisionB.startsWith("WOMENS") && !divisionA.startsWith("WOMENS")) return 1;
  
        if (divisionA.startsWith("KIDS") && !divisionB.startsWith("KIDS")) return -1;
        if (divisionB.startsWith("KIDS") && !divisionA.startsWith("KIDS")) return 1;
  
        // For other divisions, sort alphabetically
        if (divisionA < divisionB) return -1;
        if (divisionA > divisionB) return 1;
  
        return 0; // If both are the same
      };
  
      // Apply custom sorting for the division field and then by other fields
      const sortedData = data.sort((a, b) => {
        const divisionComparison = customSort(a, b);
        if (divisionComparison !== 0) return divisionComparison;
  
        // Additional sorting by other fields
        if (a["group_section"] < b["group_section"]) return -1;
        if (a["group_section"] > b["group_section"]) return 1;
        if (a["department"] < b["department"]) return -1;
        if (a["department"] > b["department"]) return 1;
        if (a["sub_department"] < b["sub_department"]) return -1;
        if (a["sub_department"] > b["sub_department"]) return 1;
        if (a["gate_date"] < b["gate_date"]) return 1;
        if (a["gate_date"] > b["gate_date"]) return -1;
        if (a["style_number"] < b["style_number"]) return -1;
        if (a["style_number"] > b["style_number"]) return 1;
        return 0;
      });
      console.log("sortedData", sortedData);
  
      setProducts(sortedData);
  
      // Set the total pages based on the sorted data
      setTotalPages(Math.ceil(sortedData.length / limit));
  
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };  

  const handleFirst = () => setCurrentPage(1);
  const handleLast = () => setCurrentPage(totalPages);
  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const statusToPercentage = {
    "IN SELECTION": 10,
    "ORDER BOOKED": 20,
    "FABRIC IN HOUSE": 30,
    "IN CUTTING": 40,
    "IN SEWING": 50,
    "IN INSPECTION": 65,
    "LOGISTIC": 85,
    "WAREHOUSE": 100,
  };  

  const handlePageChange = (e) => { 
    const value = e.target.value;
    if (value >= 1 && value <= totalPages) {
      setCurrentPage(Number(value));
    }
  };

  // Calculate the data to show for the current page
  const currentData = products.slice((currentPage - 1) * limit, currentPage * limit);

  const handleExport = () => {
    if (!products || products.length === 0) {
      console.warn("No data available to export.");
      return;
    }
  
    const headers = ["Product Reference","Image URL", "Style Number", "Colour", "Product Type", "Order Qty", "Store Launch Week", "Gate Entry Date", "Current Status"];
  
    const rows = products.map((item) => [
      item["Product_Reference"],
      item["image"] || "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Image_not_available.png/800px-Image_not_available.png",
      item["style_number"],
      item["colour"],
      item["product_type"],
      item["order_qty"],
      item["store_launch_week"],
      item["gate_date"],
      item["CurrenStatus"],
    ]);
  
    let csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GateIn_Options.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      {loading && (
        <div id="loading" className="fixed top-0 left-0 w-full h-full bg-white bg-opacity-80 flex items-center justify-center z-50">
          <span className="text-lg font-semibold text-gray-700">Loading...</span>
        </div>
      )}
      
      <div className='text-end'>
        <button className='mt-4 px-4 text-lg py-1 rounded-xl mr-16 bg-black text-white' onClick={handleExport}>
          <FontAwesomeIcon className='mr-2' icon={faFileArrowDown} />
          Export
        </button>
      </div>

      <div className="p-4 grid grid-cols-4 gap-3" id="product">
        {currentData.map((item, index) => (
          <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden border-2 border-black flex flex-col justify-between">
            <div>
              <div className="h-64 relative p-2">
                <img className="w-full h-full object-contain" src={item["image"] || "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Image_not_available.png/800px-Image_not_available.png"} alt="Product" />
              </div>
              <div className="p-4">
                <table className="w-full bg-white border-collapse">
                  <tbody>
                  <tr><td className="font-semibold border border-gray-200 px-4 py-2">Product Type</td><td className='border border-gray-200 text-center font-semibold text-[#f75955]'>{item["product_type"]}</td></tr>
                    <tr><td className="font-semibold border border-gray-200 px-4 py-2">Style Number</td><td className='border border-gray-200 text-center'>{item["style_number"]}</td></tr>
                    <tr><td className="font-semibold border border-gray-200 px-4 py-2">Colour</td><td className='border border-gray-200 text-center'>{item.colour}</td></tr>
                    <tr><td className="font-semibold border border-gray-200 px-4 py-2">Order Qty</td><td className='border border-gray-200 text-center'>{item["order_qty"]}</td></tr>
                    <tr><td className="font-semibold border border-gray-200 px-4 py-2">Store Launch Week</td><td className='border border-gray-200 text-center'>{item["store_launch_week"]}</td></tr>
                    <tr><td className="font-semibold border border-gray-200 px-4 py-2">Gate Entry Date</td><td className='border border-gray-200 text-center'>{item["gate_date"] ? new Date(item["gate_date"]).toISOString().split("T")[0].split("-").reverse().join("-") : "N/A"}</td></tr>
                    <tr><td className="font-semibold border border-gray-200 px-4 py-2">Current Status</td><td className='border border-gray-200 text-center'>{item["CurrenStatus"]}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className='mt-auto'>
              <div className="px-4 pb-4">
                {/* <p className="text-lg font-bold ml-2">{statusToPercentage[item["CurrenStatus"]] || 0}% <span className='text-sm font-normal'>Sell out</span></p> */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${statusToPercentage[item["CurrenStatus"]] || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div id="pagination" className="flex justify-center mt-4 space-x-2 mb-4">
        <button
          id="firstBtn"
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded disabled:bg-gray-300"
          onClick={handleFirst}
          disabled={currentPage === 1}
        >
          First
        </button>
        
        <button
          id="prevBtn"
          className="flex items-center px-1 bg-blue-500 text-white rounded disabled:bg-gray-300 my-2"
          onClick={handlePrev}
          disabled={currentPage === 1}
        >
          <FaChevronLeft className="h-4 w-4" />
        </button>

        <span id="pageIndicator" className="text-lg text-black font-semibold mx-4">
          Page
          <input
            type="number"
            value={currentPage}
            onChange={handlePageChange}
            min="1"
            max={totalPages}
            className="w-12 text-center mx-2 border border-gray-300 rounded mt-1"
          />
          of {totalPages}
        </span>

        <button
          id="nextBtn"
          className="flex items-center px-1 bg-blue-500 text-white rounded disabled:bg-gray-300 my-2"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          <FaChevronRight className="h-4 w-4" />
        </button>

        <button
          id="lastBtn"
          className="px-4 py-2 bg-blue-500 font-semibold text-white rounded disabled:bg-gray-300"
          onClick={handleLast}
          disabled={currentPage === totalPages}
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default ProductList;
