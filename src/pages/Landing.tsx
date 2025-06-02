import { Link } from 'react-router-dom';
import { Zap, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Zap size={32} className="text-accent-500" />
            <span className="ml-2 text-2xl font-medium text-primary-800">Whizlist</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="text-primary-700 hover:text-primary-900 font-medium"
            >
              Log in
            </Link>
            <Link to="/signup">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 text-center">
        <h1 className="text-5xl font-bold text-primary-900 mb-6">
          Save and organize anything from around the web
        </h1>
        <p className="text-xl text-primary-600 max-w-2xl mx-auto mb-12">
          Whizlist helps you collect, organize, and share products you love. Create lists, collaborate with others, and never lose track of your favorite items.
        </p>
        
        <Link to="/signup">
          <Button size="lg" className="mb-16">Get Started - It's Free</Button>
        </Link>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-accent-500 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-medium text-primary-900 mb-1">Save Anything</h3>
              <p className="text-primary-600">Bookmark products from any website with our easy-to-use tools.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-accent-500 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-medium text-primary-900 mb-1">Stay Organized</h3>
              <p className="text-primary-600">Create lists and folders to keep your collections perfectly organized.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-accent-500 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-medium text-primary-900 mb-1">Collaborate</h3>
              <p className="text-primary-600">Share lists with friends and family for easy collaboration.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;