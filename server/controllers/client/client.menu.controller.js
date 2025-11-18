import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";



const getMenu = asyncHandler(async (req, res) => {
      const { 
        page = 1, 
        limit = 10, 
        restaurantId, 
        category, 
        isAvailable,
        search,
        isVeg
      } = req.query;
      
      const skip = (page - 1) * limit;

      const where = {
        isActive: true
      };
      
      if (restaurantId) where.restaurantId = parseInt(restaurantId);
      if (category) where.category = category;
      if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
      if( isVeg !== undefined ) where.isVeg = isVeg === 'true';
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [menuItems, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.menuItem.count({ where })
      ]);
      console.log({
        items: menuItems,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });
      res.status(200).json(new ApiResponse(200, {
        items: menuItems,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      },"Menu items fetched successfully"));
  });


//   const { id } = req.params;
//   try {
//       const menuItem = await prisma.menuItem.findUnique({
//         where: { id: parseInt(id) },
//         include: {
//           restaurant: true,
//           orderItems: {
//             include: {
//               order: true
//             }
//           }
//         }
//       });
      
//       if (!menuItem) {
//         return res.status(404).json({
//           success: false,
//           message: 'Menu item not found'
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: menuItem
//       });

//     } catch (error) {
//       console.error('Error fetching menu item:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to fetch menu item',
//         error: error.message
//       });
//     }
// });

const getItemDetails = asyncHandler(async(req,res)=>{
    const { id } = req.params;
  try {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: parseInt(id) },
        include: {
          restaurant: true,
          orderItems: {
            include: {
              order: true
            }
          }
        }
      });
      
      if (!menuItem) {
        throw new ApiError(404, "Menu item not found");
      }

      res.status(200).json(new ApiResponse(200, "Menu item fetched successfully", menuItem));

    } catch (error) {
      console.error('Error fetching menu item:', error);
    throw new ApiError(500, "Failed to fetch menu item");
    }
});


const getMostPopular = asyncHandler(async(req,res)=>{

});

export {getMenu,getItemDetails,getMostPopular};