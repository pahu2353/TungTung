import React from 'react'

interface DataListComponentType {
  list: string[]
}

const DataListComponent = ({list}: DataListComponentType) => {
  return (
    <div className="flex flex-col divide-y divide-gray-300 p-2 min-w-50">
      {list.map((item: string) => {
        return <div>{item}</div>
      })}
    </div>
  )
}

export default DataListComponent
